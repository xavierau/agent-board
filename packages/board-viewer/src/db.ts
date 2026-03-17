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

// Board ownership/visibility migration
try {
  db.prepare("SELECT owner FROM boards LIMIT 0").run();
} catch {
  db.exec("ALTER TABLE boards ADD COLUMN owner TEXT NOT NULL DEFAULT ''");
}

try {
  db.prepare("SELECT visibility FROM boards LIMIT 0").run();
} catch {
  db.exec("ALTER TABLE boards ADD COLUMN visibility TEXT NOT NULL DEFAULT 'public'");
}

db.exec(`CREATE TABLE IF NOT EXISTS board_members (
  board_id TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  added_at TEXT NOT NULL,
  PRIMARY KEY (board_id, agent_id)
)`);

db.exec("UPDATE boards SET owner = created_by WHERE owner = ''");

db.exec(`CREATE TABLE IF NOT EXISTS board_labels (
  id TEXT PRIMARY KEY,
  board_id TEXT NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#888888',
  created_at TEXT NOT NULL,
  UNIQUE(board_id, name)
)`);

db.exec(`CREATE TABLE IF NOT EXISTS checklists (
  id TEXT PRIMARY KEY,
  card_id TEXT NOT NULL,
  title TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
)`);

db.exec(`CREATE TABLE IF NOT EXISTS checklist_items (
  id TEXT PRIMARY KEY,
  checklist_id TEXT NOT NULL,
  text TEXT NOT NULL,
  completed INTEGER NOT NULL DEFAULT 0,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
)`);

db.exec('CREATE INDEX IF NOT EXISTS idx_checklists_card ON checklists(card_id)');
db.exec('CREATE INDEX IF NOT EXISTS idx_checklist_items_checklist ON checklist_items(checklist_id)');

// Migrate existing ad-hoc card labels into board registry
db.exec(`INSERT OR IGNORE INTO board_labels (id, board_id, name, color, created_at)
  SELECT lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' ||
    substr(hex(randomblob(2)),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) ||
    substr(hex(randomblob(2)),2) || '-' || hex(randomblob(6))),
    c.board_id, cl.label, cl.color, cl.added_at
  FROM card_labels cl JOIN cards c ON cl.card_id = c.id
  GROUP BY c.board_id, cl.label`);
