import Database from 'better-sqlite3';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = join(fileURLToPath(import.meta.url), '..', '..', '..', '..');
const dbPath = join(projectRoot, 'data', 'kanban.db');

export const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
