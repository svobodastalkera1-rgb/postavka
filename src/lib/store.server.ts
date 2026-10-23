import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { randomUUID } from "node:crypto";
import { type Supplier } from "./fixtures";
import { CATALOG } from "./catalog";
import { recalculate } from "./scoring";

export type Change = { id: string; supplierId: string; field: string; before: unknown; after: unknown; author: string; source: string; method: string; confirmation: string; changedAt: string };
export type Interaction = { id: string; supplierId: string; type: string; text: string; author: string; createdAt: string };
export type Proposal = { id: string; supplierId: string; field: string; proposed: unknown; source: string; createdAt: string };

let database: DatabaseSync | undefined;
export function closeStore() { database?.close(); database = undefined; }
function db() {
  if (database) return database;
  const path = resolve(process.env["POSTAVKA_DB_PATH"] || "data/postavka.sqlite");
  mkdirSync(dirname(path), { recursive: true });
  const next = new DatabaseSync(path);
  next.exec(`PRAGMA journal_mode=WAL;
    CREATE TABLE IF NOT EXISTS suppliers (id TEXT PRIMARY KEY, data TEXT NOT NULL, updated_at TEXT NOT NULL);
    CREATE INDEX IF NOT EXISTS suppliers_updated_at ON suppliers(updated_at, id);
    CREATE TABLE IF NOT EXISTS changes (id TEXT PRIMARY KEY, supplier_id TEXT NOT NULL, field TEXT NOT NULL, before_value TEXT, after_value TEXT, author TEXT NOT NULL, source TEXT NOT NULL, changed_at TEXT NOT NULL);
    CREATE INDEX IF NOT EXISTS changes_supplier ON changes(supplier_id, changed_at);
    CREATE TABLE IF NOT EXISTS field_meta (supplier_id TEXT NOT NULL, field TEXT NOT NULL, source TEXT NOT NULL, method TEXT NOT NULL, author TEXT NOT NULL, changed_at TEXT NOT NULL, confirmation TEXT NOT NULL, PRIMARY KEY(supplier_id,field));
    CREATE TABLE IF NOT EXISTS proposals (id TEXT PRIMARY KEY, supplier_id TEXT NOT NULL, field TEXT NOT NULL, proposed TEXT NOT NULL, source TEXT NOT NULL, created_at TEXT NOT NULL, status TEXT NOT NULL);
    CREATE INDEX IF NOT EXISTS proposals_supplier ON proposals(supplier_id,status);
    CREATE TABLE IF NOT EXISTS interactions (id TEXT PRIMARY KEY, supplier_id TEXT NOT NULL, type TEXT NOT NULL, text TEXT NOT NULL, author TEXT NOT NULL, created_at TEXT NOT NULL);
    CREATE INDEX IF NOT EXISTS interactions_supplier ON interactions(supplier_id, created_at);`);
  const columns = next.prepare("PRAGMA table_info(changes)").all() as { name: string }[];
  if (!columns.some((column) => column.name === "method")) next.exec("ALTER TABLE changes ADD COLUMN method TEXT NOT NULL DEFAULT 'manual'");
  if (!columns.some((column) => column.name === "confirmation")) next.exec("ALTER TABLE changes ADD COLUMN confirmation TEXT NOT NULL DEFAULT 'unconfirmed'");
  const count = next.prepare("SELECT COUNT(*) AS n FROM suppliers").get() as { n: number };
  if (!count.n) {
    const insert = next.prepare("INSERT INTO suppliers (id,data,updated_at) VALUES (?,?,?)");
    const provenance = next.prepare("INSERT OR IGNORE INTO field_meta(supplier_id,field,source,method,author,changed_at,confirmation) VALUES(?,?,?,?,?,?,?)");
    for (const supplier of CATALOG) {
      insert.run(supplier.id, JSON.stringify(supplier), new Date().toISOString());
      for (const [field, value] of Object.entries(supplier)) {
        if (value === null || value === "" || Array.isArray(value) && !value.length) continue;
        provenance.run(supplier.id, field, "web", "manual research", "Каталог", supplier.discoveredAt, "unconfirmed");
      }
    }
  }
  database = next;
  return next;
}

export function importCatalog(): { added: number; skipped: number } {
  const current = (db().prepare("SELECT data FROM suppliers").all() as { data: string }[]).map((row) => JSON.parse(row.data) as Supplier);
  const siteKey = (url: string | null) => { try { return url ? `site:${new URL(url).hostname.replace(/^www\./, "")}` : ""; } catch { return ""; } };
  const keys = new Set(current.flatMap((item) => [item.inn ? `inn:${item.inn}` : "", siteKey(item.website)].filter(Boolean)));
  const ids = new Set(current.map((item) => item.id));
  const insert = db().prepare("INSERT INTO suppliers(id,data,updated_at) VALUES(?,?,?)");
  const provenance = db().prepare("INSERT OR IGNORE INTO field_meta(supplier_id,field,source,method,author,changed_at,confirmation) VALUES(?,?,?,?,?,?,?)");
  let added = 0;
  db().exec("BEGIN IMMEDIATE");
  try {
    for (const item of CATALOG) {
      const itemKeys = [item.inn ? `inn:${item.inn}` : "", siteKey(item.website)].filter(Boolean);
      if (ids.has(item.id) || itemKeys.some((key) => keys.has(key))) continue;
      insert.run(item.id, JSON.stringify(item), new Date().toISOString());
      for (const [field, value] of Object.entries(item)) {
        if (value === null || value === "" || Array.isArray(value) && !value.length) continue;
        provenance.run(item.id, field, "web", "manual research", "Каталог", item.discoveredAt, "unconfirmed");
      }
      ids.add(item.id); itemKeys.forEach((key) => keys.add(key)); added++;
    }
    db().exec("COMMIT");
  } catch (error) { db().exec("ROLLBACK"); throw error; }
  return { added, skipped: CATALOG.length - added };
}

export function listSuppliers(updatedAfter?: string, limit = 50, offset = 0): { items: (Supplier & { updatedAt: string })[]; total: number } {
  const filter = updatedAfter ? "WHERE updated_at > ?" : "";
  const args = updatedAfter ? [updatedAfter] : [];
  const total = (db().prepare(`SELECT COUNT(*) AS n FROM suppliers ${filter}`).get(...args) as { n: number }).n;
  const rows = db().prepare(`SELECT data,updated_at FROM suppliers ${filter} ORDER BY updated_at DESC, id LIMIT ? OFFSET ?`).all(...args, limit, offset) as { data: string; updated_at: string }[];
  return { items: rows.map((row) => ({ ...JSON.parse(row.data) as Supplier, updatedAt: row.updated_at })), total };
}

export function findSupplier(id: string): Supplier | null {
  const row = db().prepare("SELECT data FROM suppliers WHERE id=?").get(id) as { data: string } | undefined;
  return row ? JSON.parse(row.data) as Supplier : null;
}

export function saveSupplier(input: Supplier, author: string, source = "employee"): Supplier {
  const previous = findSupplier(input.id);
  const now = new Date().toISOString();
  const write = db().prepare("INSERT INTO suppliers(id,data,updated_at) VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data, updated_at=excluded.updated_at");
  const audit = db().prepare("INSERT INTO changes(id,supplier_id,field,before_value,after_value,author,source,changed_at,method,confirmation) VALUES(?,?,?,?,?,?,?,?,?,?)");
  const meta = db().prepare("INSERT INTO field_meta(supplier_id,field,source,method,author,changed_at,confirmation) VALUES(?,?,?,?,?,?,?) ON CONFLICT(supplier_id,field) DO UPDATE SET source=excluded.source,method=excluded.method,author=excluded.author,changed_at=excluded.changed_at,confirmation=excluded.confirmation");
  const proposal = db().prepare("INSERT INTO proposals(id,supplier_id,field,proposed,source,created_at,status) VALUES(?,?,?,?,?,?,'pending')");
  db().exec("BEGIN IMMEDIATE");
  try {
    if (previous && source !== "employee") {
      for (const [field, value] of Object.entries(input)) {
        const before = previous[field as keyof Supplier];
        if (JSON.stringify(before) === JSON.stringify(value)) continue;
        const state = db().prepare("SELECT confirmation FROM field_meta WHERE supplier_id=? AND field=?").get(input.id, field) as { confirmation: string } | undefined;
        if (state?.confirmation === "confirmed") {
          proposal.run(randomUUID(), input.id, field, JSON.stringify(value), source, now);
          (input as unknown as Record<string, unknown>)[field] = before;
        }
      }
    }
    input = recalculate(input);
    write.run(input.id, JSON.stringify(input), now);
    for (const [field, after] of Object.entries(input)) {
      if (["id", "score", "confidence"].includes(field)) continue;
      if (!previous && (after === null || after === false || after === "" || Array.isArray(after) && after.length === 0)) continue;
      const before = previous?.[field as keyof Supplier];
      if (JSON.stringify(before) !== JSON.stringify(after)) {
        const confirmation = source === "employee" && input.verified ? "confirmed" : "unconfirmed";
        audit.run(randomUUID(), input.id, field, JSON.stringify(before ?? null), JSON.stringify(after), author, source, now, source === "employee" ? "manual" : "integration", confirmation);
        meta.run(input.id, field, source, source === "employee" ? "manual" : "integration", author, now, confirmation);
      }
    }
    if (source === "employee" && input.verified && !previous?.verified) {
      for (const field of Object.keys(input)) meta.run(input.id, field, "employee", "manual", author, now, "confirmed");
    }
    db().exec("COMMIT");
  } catch (error) { db().exec("ROLLBACK"); throw error; }
  return input;
}

export function changesFor(id: string): Change[] {
  const rows = db().prepare("SELECT * FROM changes WHERE supplier_id=? ORDER BY changed_at DESC").all(id) as { id: string; supplier_id: string; field: string; before_value: string; after_value: string; author: string; source: string; method: string; confirmation: string; changed_at: string }[];
  return rows.map((r) => ({ id: r.id, supplierId: r.supplier_id, field: r.field, before: JSON.parse(r.before_value), after: JSON.parse(r.after_value), author: r.author, source: r.source, method: r.method, confirmation: r.confirmation, changedAt: r.changed_at }));
}

export function proposalsFor(id: string): Proposal[] {
  const rows = db().prepare("SELECT * FROM proposals WHERE supplier_id=? AND status='pending' ORDER BY created_at DESC").all(id) as { id: string; supplier_id: string; field: string; proposed: string; source: string; created_at: string }[];
  return rows.map((r) => ({ id: r.id, supplierId: r.supplier_id, field: r.field, proposed: JSON.parse(r.proposed), source: r.source, createdAt: r.created_at }));
}

export function resolveProposal(id: string, proposalId: string, accept: boolean, author: string): Supplier | null {
  const row = db().prepare("SELECT field,proposed FROM proposals WHERE id=? AND supplier_id=? AND status='pending'").get(proposalId, id) as { field: string; proposed: string } | undefined;
  const supplier = findSupplier(id);
  if (!row || !supplier) return null;
  if (!accept) { db().prepare("UPDATE proposals SET status='rejected' WHERE id=?").run(proposalId); return supplier; }
  const next = { ...supplier, [row.field]: JSON.parse(row.proposed) } as Supplier;
  const saved = saveSupplier(next, author);
  db().prepare("UPDATE proposals SET status='accepted' WHERE id=?").run(proposalId);
  return saved;
}

export function interactionsFor(id: string): Interaction[] {
  const rows = db().prepare("SELECT * FROM interactions WHERE supplier_id=? ORDER BY created_at DESC").all(id) as { id: string; supplier_id: string; type: string; text: string; author: string; created_at: string }[];
  return rows.map((r) => ({ id: r.id, supplierId: r.supplier_id, type: r.type, text: r.text, author: r.author, createdAt: r.created_at }));
}

export function recentEvents(): { id: string; supplierId: string; type: string; text: string; author: string; date: string }[] {
  const interactions = db().prepare("SELECT id,supplier_id,type,text,author,created_at FROM interactions ORDER BY created_at DESC LIMIT 100").all() as { id: string; supplier_id: string; type: string; text: string; author: string; created_at: string }[];
  const changes = db().prepare("SELECT id,supplier_id,field,author,changed_at FROM changes ORDER BY changed_at DESC LIMIT 100").all() as { id: string; supplier_id: string; field: string; author: string; changed_at: string }[];
  return [...interactions.map((row) => ({ id: row.id, supplierId: row.supplier_id, type: row.type, text: row.text, author: row.author, date: row.created_at })),
    ...changes.map((row) => ({ id: row.id, supplierId: row.supplier_id, type: "Изменение карточки", text: `Изменено поле «${row.field}»`, author: row.author, date: row.changed_at }))]
    .sort((a, b) => b.date.localeCompare(a.date)).slice(0, 100);
}

export function addInteraction(id: string, type: string, text: string, author: string): Interaction {
  const item = { id: randomUUID(), supplierId: id, type, text, author, createdAt: new Date().toISOString() };
  db().prepare("INSERT INTO interactions VALUES (?,?,?,?,?,?)").run(item.id, id, type, text, author, item.createdAt);
  return item;
}
