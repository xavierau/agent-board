import Database from 'better-sqlite3';

const CREATE_EVENTS_TABLE = `
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  stream_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload TEXT NOT NULL,
  version INTEGER NOT NULL,
  actor_id TEXT NOT NULL DEFAULT '',
  occurred_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(stream_id, version)
)`;

const CREATE_EVENTS_INDEX =
  'CREATE INDEX IF NOT EXISTS idx_events_stream ON events(stream_id, version)';

const CREATE_CARDS_TABLE = `
CREATE TABLE IF NOT EXISTS cards (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  column_name TEXT NOT NULL DEFAULT 'todo',
  position INTEGER NOT NULL DEFAULT 0,
  board_id TEXT NOT NULL DEFAULT '',
  archived INTEGER NOT NULL DEFAULT 0,
  assignee TEXT DEFAULT NULL,
  labels TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
)`;

const CREATE_CARDS_INDEX =
  'CREATE INDEX IF NOT EXISTS idx_cards_column ON cards(column_name, position)';

const CREATE_BOARDS_TABLE = `
CREATE TABLE IF NOT EXISTS boards (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  columns TEXT NOT NULL DEFAULT '["todo","doing","done"]',
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
)`;

const CREATE_CARD_LABELS_TABLE = `
CREATE TABLE IF NOT EXISTS card_labels (
  card_id TEXT NOT NULL,
  label TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#888888',
  added_at TEXT NOT NULL,
  PRIMARY KEY (card_id, label)
)`;

const CREATE_COMMENTS_TABLE = `
CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY,
  card_id TEXT NOT NULL,
  parent_comment_id TEXT,
  author_id TEXT NOT NULL,
  text TEXT NOT NULL,
  created_at TEXT NOT NULL
)`;

const CREATE_COMMENTS_INDEX =
  'CREATE INDEX IF NOT EXISTS idx_comments_card ON comments(card_id)';

export function createDatabase(dbPath?: string): Database.Database {
  const db = new Database(dbPath ?? ':memory:');
  db.pragma('journal_mode = WAL');
  db.exec(CREATE_EVENTS_TABLE);
  db.exec(CREATE_EVENTS_INDEX);
  db.exec(CREATE_CARDS_TABLE);
  db.exec(CREATE_CARDS_INDEX);
  db.exec(CREATE_BOARDS_TABLE);
  db.exec(CREATE_CARD_LABELS_TABLE);
  db.exec(CREATE_COMMENTS_TABLE);
  db.exec(CREATE_COMMENTS_INDEX);
  return db;
}
