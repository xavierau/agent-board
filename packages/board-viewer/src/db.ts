import Database from 'better-sqlite3';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = join(fileURLToPath(import.meta.url), '..', '..', '..', '..');
const dbPath = join(projectRoot, 'data', 'kanban.db');

export const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

// Ensure assignee column exists (safe migration)
try {
  db.prepare("SELECT assignee FROM cards LIMIT 0").run();
} catch {
  db.exec("ALTER TABLE cards ADD COLUMN assignee TEXT DEFAULT NULL");
}
