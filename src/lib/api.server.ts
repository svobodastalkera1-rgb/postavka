import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { addInteraction, changesFor, findSupplier, importCatalog, interactionsFor, listSuppliers, proposalsFor, recentEvents, resolveProposal, saveSupplier } from "./store.server";
import { type Supplier } from "./fixtures";
import { z } from "zod";

const json = (value: unknown, status = 200, headers?: HeadersInit) => Response.json(value, { status, headers: { "Cache-Control": "no-store", ...headers } });
const unauthorized = () => json({ error: "Требуется вход" }, 401);
const secret = () => process.env['POSTAVKA_SESSION_SECRET'];
function publicOrigin(request: Request, url: URL) {
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const host = request.headers.get("host");
  return forwardedProto === "https" && host ? `https://${host}` : url.origin;
}

function equal(a: string, b: string) {
  const aa = Buffer.from(a), bb = Buffer.from(b);
  return aa.length === bb.length && timingSafeEqual(aa, bb);
}

function signed(value: string) { return createHmac("sha256", secret()!).update(value).digest("hex"); }
function employee(request: Request): string | null {
  const cookie = request.headers.get("cookie")?.match(/(?:^|; )postavka_session=([^;]+)/)?.[1];
  if (!cookie || !secret()) return null;
  const [name, expiry, signature] = cookie.split(".");
  if (!name || !expiry || !signature || Number(expiry) < Date.now()) return null;
  return equal(signature, signed(`${name}.${expiry}`)) ? decodeURIComponent(name) : null;
}
function integration(request: Request): boolean {
  const key = process.env['POSTAVKA_INTEGRATION_TOKEN'];
  return !!key && equal(request.headers.get("authorization") ?? "", `Bearer ${key}`);
}
function actor(request: Request) { return employee(request) ?? (integration(request) ? "integration" : null); }
function visible(s: Supplier, authorized: boolean): Supplier {
  return authorized ? s : { ...s, notes: null, contacts: [], prices: [], rating: null, confidenceOverride: null };
}
async function body(request: Request): Promise<Record<string, unknown> | null> {
  try { const data = await request.json(); return data && typeof data === "object" && !Array.isArray(data) ? data : null; } catch { return null; }
}

const short = z.string().trim().max(500);
const optionalText = short.nullable();
const strings = z.array(short).max(100);
const editSchema = z.object({
  name: short.min(1), legalName: optionalText, inn: optionalText, website: optionalText, phone: optionalText,
  email: optionalText, address: optionalText, city: short.min(1), regions: strings,
  group: z.enum(["food", "consumables"]), categories: strings, assortment: strings,
  prices: z.array(z.object({ item: short.min(1), price: z.number().finite().nonnegative(), unit: short.min(1) })).max(100),
  minOrder: optionalText, minOrderRub: z.number().finite().nonnegative().nullable(), delivery: optionalText,
  hasDelivery: z.boolean().nullable(), documents: strings, rating: z.number().finite().min(0).max(5).nullable(),
  status: z.enum(["discovered","review","contact_planned","contacted","quote_requested","quote_received","negotiation","active","ended","rejected"]),
  blacklisted: z.object({ reason: short, author: short, date: short }).nullable(), favorite: z.boolean(), verified: z.boolean(), workedWith: z.boolean(),
  contacts: z.array(z.object({ name: short.min(1), role: short, phone: optionalText, email: optionalText })).max(100),
  notes: z.string().max(10000).nullable(), verifiedAt: optionalText,
  confidenceOverride: z.object({ value: z.number().int().min(0).max(100), reason: z.string().trim().min(3).max(500) }).nullable(),
  sources: z.array(z.object({ url: short, date: short })).max(100),
}).partial().strict();
function patchSupplier(previous: Supplier, data: Record<string, unknown>): Supplier | null {
  const parsed = editSchema.safeParse(data);
  if (!parsed.success) return null;
  const next = Object.assign({}, previous, parsed.data) as Supplier;
  return next.name.trim() && next.city.trim() ? next : null;
}

export async function api(request: Request): Promise<Response | null> {
  const url = new URL(request.url);
  if (!url.pathname.startsWith("/api/")) return null;
  if (!["GET", "HEAD"].includes(request.method) && !integration(request)) {
    const origin = request.headers.get("origin");
    if (origin && origin !== publicOrigin(request, url)) return json({ error: "Недопустимый источник запроса" }, 403);
  }
  const path = url.pathname.split("/").filter(Boolean);
  if (path[1] === "session") {
    if (request.method === "GET") return json({ authenticated: !!employee(request), name: employee(request) });
    if (request.method === "DELETE") return json({ authenticated: false }, 200, { "Set-Cookie": "postavka_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0" });
    if (request.method === "POST") {
      const data = await body(request);
      const password = process.env['POSTAVKA_EDITOR_PASSWORD'];
      if (!password || !secret() || typeof data?.['password'] !== "string" || !equal(data['password'], password)) return unauthorized();
      const name = encodeURIComponent(typeof data['name'] === "string" && data['name'].trim() ? data['name'].trim().slice(0, 80) : "Сотрудник").replaceAll(".", "%2E");
      const expiry = String(Date.now() + 12 * 60 * 60 * 1000);
      const value = `${name}.${expiry}.${signed(`${name}.${expiry}`)}`;
      return json({ authenticated: true }, 200, { "Set-Cookie": `postavka_session=${value}; HttpOnly; SameSite=Strict; Path=/; Max-Age=43200${publicOrigin(request, url).startsWith("https:") ? "; Secure" : ""}` });
    }
  }
  if (path[1] === "catalog" && path[2] === "import" && request.method === "POST") return employee(request) ? json(importCatalog()) : unauthorized();
  if (path[1] === "events" && request.method === "GET") return actor(request) ? json(recentEvents()) : unauthorized();
  if (path[1] !== "suppliers") return json({ error: "Не найдено" }, 404);
  const id = path[2];
  if (request.method === "GET" && !id) {
    const rawLimit = Number(url.searchParams.get("limit"));
    const rawOffset = Number(url.searchParams.get("offset"));
    const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(100, Math.floor(rawLimit)) : 50;
    const offset = Number.isFinite(rawOffset) && rawOffset >= 0 ? Math.floor(rawOffset) : 0;
    const result = listSuppliers(url.searchParams.get("updated_after") || undefined, limit, offset);
    return json({ ...result, items: result.items.map((item) => visible(item, !!actor(request))), limit, offset });
  }
  if (request.method === "GET" && id) {
    const supplier = findSupplier(id);
    if (!supplier) return json({ error: "Поставщик не найден" }, 404);
    if (path[3] === "changes") return actor(request) ? json(changesFor(id)) : unauthorized();
    if (path[3] === "interactions") return actor(request) ? json(interactionsFor(id)) : unauthorized();
    if (path[3] === "proposals") return actor(request) ? json(proposalsFor(id)) : unauthorized();
    if (!path[3]) return json(visible(supplier, !!actor(request)));
  }
  const who = actor(request);
  if (!who) return unauthorized();
  if (request.method === "POST" && !id) {
    const data = await body(request);
    if (!data) return json({ error: "Некорректный JSON" }, 400);
    const blank: Supplier = { group: "food", id: randomUUID(), name: "", legalName: null, inn: null, website: null, phone: null, email: null, address: null, city: "Екатеринбург", regions: [], categories: [], assortment: [], prices: [], minOrder: null, minOrderRub: null, delivery: null, hasDelivery: null, documents: [], rating: null, score: { assortment: 0, logistics: 0, commercial: 0, reliability: 0, history: null }, confidence: 0, confidenceOverride: null, status: "discovered", blacklisted: null, favorite: false, verified: false, workedWith: false, contacts: [], notes: null, discoveredAt: new Date().toISOString().slice(0, 10), verifiedAt: null, sources: [] };
    const supplier = patchSupplier(blank, data);
    return supplier ? json(saveSupplier(supplier, who, integration(request) ? "external integration" : "employee"), 201) : json({ error: "Некорректные поля" }, 400);
  }
  if (id && request.method === "PATCH" && !path[3]) {
    const old = findSupplier(id);
    if (!old) return json({ error: "Поставщик не найден" }, 404);
    const data = await body(request);
    const supplier = data && patchSupplier(old, data);
    return supplier ? json(saveSupplier(supplier, who, integration(request) ? "external integration" : "employee"), 200) : json({ error: "Некорректные поля" }, 400);
  }
  if (id && path[3] === "proposals" && path[4] && path[5] && request.method === "POST") {
    if (integration(request)) return json({ error: "Разрешать конфликт может только сотрудник" }, 403);
    if (!["accept", "reject"].includes(path[5])) return json({ error: "Не найдено" }, 404);
    const result = resolveProposal(id, path[4], path[5] === "accept", who);
    return result ? json(result) : json({ error: "Предложение не найдено" }, 404);
  }
  if (id && path[3] === "interactions" && request.method === "POST") {
    if (!findSupplier(id)) return json({ error: "Поставщик не найден" }, 404);
    const data = await body(request);
    if (!data || typeof data['text'] !== "string" || !data['text'].trim() || typeof data['type'] !== "string") return json({ error: "Некорректная запись" }, 400);
    return json(addInteraction(id, data['type'].slice(0, 60), data['text'].trim().slice(0, 5000), who), 201);
  }
  return json({ error: "Метод не поддерживается" }, 405);
}

