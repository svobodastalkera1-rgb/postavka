import { backup, DatabaseSync } from "node:sqlite";
import { chmodSync, mkdirSync, renameSync, unlinkSync } from "node:fs";
import { dirname, resolve } from "node:path";

const source = process.env.POSTAVKA_DB_PATH;
const destination = process.argv[2];
if (!source || !destination) {
  console.error("Usage: POSTAVKA_DB_PATH=/private/path/postavka.sqlite node backup.mjs /private/backups/postavka-YYYY-MM-DD.sqlite");
  process.exit(2);
}

const target = resolve(destination);
if (target === resolve(source)) throw new Error("Backup destination must differ from the live database");
process.umask(0o077);
mkdirSync(dirname(target), { recursive: true, mode: 0o700 });
const temporary = `${target}.partial-${process.pid}`;
const db = new DatabaseSync(resolve(source), { readOnly: true, timeout: 5000 });
try {
  await backup(db, temporary);
  const check = new DatabaseSync(temporary, { readOnly: true });
  try {
    if (check.prepare("PRAGMA integrity_check").get()?.integrity_check !== "ok") {
      throw new Error("Backup integrity check failed");
    }
  } finally {
    check.close();
  }
  chmodSync(temporary, 0o600);
  renameSync(temporary, target);
  console.log(`Verified backup: ${target}`);
} catch (error) {
  try { unlinkSync(temporary); } catch { /* No partial file to remove. */ }
  throw error;
} finally {
  db.close();
}

