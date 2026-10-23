// @vitest-environment node
import { afterAll, beforeAll, expect, test } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

let folder: string;
let cookie = "";
let api: typeof import("../lib/api.server").api;
let closeStore: typeof import("../lib/store.server").closeStore;
const base = "http://127.0.0.1:4177/api";
async function call(path: string, method = "GET", data?: unknown, headers: Record<string, string> = {}) {
  const request = new Request(`${base}${path}`, { method, headers: { ...headers, ...(data === undefined ? {} : { "content-type": "application/json" }) }, ...(data === undefined ? {} : { body: JSON.stringify(data) }) });
  return (await api(request))!;
}

beforeAll(async () => {
  folder = mkdtempSync(join(tmpdir(), "postavka-test-"));
  process.env["POSTAVKA_DB_PATH"] = join(folder, "test.sqlite");
  process.env["POSTAVKA_EDITOR_PASSWORD"] = "test-password";
  process.env["POSTAVKA_SESSION_SECRET"] = "test-secret-at-least-thirty-two-characters";
  process.env["POSTAVKA_INTEGRATION_TOKEN"] = "integration-test-token";
  ({ api } = await import("../lib/api.server"));
  ({ closeStore } = await import("../lib/store.server"));
  const response = await call("/session", "POST", { name: "Тестовый сотрудник", password: "test-password" });
  cookie = response.headers.get("set-cookie")!.split(";")[0]!;
});
afterAll(() => { closeStore(); rmSync(folder, { recursive: true, force: true }); });

test("изменения карточки переживают повторное открытие БД; подтверждённое значение защищено", async () => {
  const created = await call("/suppliers", "POST", { name: "Проверка", city: "Екатеринбург", group: "food" }, { cookie });
  expect(created.status).toBe(201);
  const id = (await created.json() as { id: string }).id;
  const edited = await call(`/suppliers/${id}`, "PATCH", { minOrder: "5000 ₽", assortment: ["Молоко"], verified: true }, { cookie });
  expect(edited.status).toBe(200);
  const score = (await edited.json() as { score: { assortment: number } }).score.assortment;
  expect(score).toBeGreaterThan(0);
  closeStore();
  const reopened = await call(`/suppliers/${id}`, "GET", undefined, { cookie });
  expect((await reopened.json() as { minOrder: string }).minOrder).toBe("5000 ₽");
  const imported = await call(`/suppliers/${id}`, "PATCH", { minOrder: "7000 ₽" }, { authorization: "Bearer integration-test-token" });
  expect((await imported.json() as { minOrder: string }).minOrder).toBe("5000 ₽");
  const proposals = await call(`/suppliers/${id}/proposals`, "GET", undefined, { cookie });
  const pending = await proposals.json() as { id: string }[];
  expect(pending).toHaveLength(1);
  const accepted = await call(`/suppliers/${id}/proposals/${pending[0]!.id}/accept`, "POST", undefined, { cookie });
  expect((await accepted.json() as { minOrder: string }).minOrder).toBe("7000 ₽");
  const changes = await call(`/suppliers/${id}/changes`, "GET", undefined, { cookie });
  expect((await changes.json() as unknown[]).length).toBeGreaterThan(0);
});

test("аноним не может изменять карточку или читать историю взаимодействий", async () => {
  expect((await call("/suppliers/s1", "PATCH", { status: "active" })).status).toBe(401);
  expect((await call("/suppliers/s1/interactions")).status).toBe(401);
  const publicSupplier = await call("/suppliers/s1");
  expect((await publicSupplier.json() as { contacts: unknown[]; notes: unknown }).contacts).toEqual([]);
});
