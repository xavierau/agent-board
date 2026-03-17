export const TABLES = [
  `CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    stream_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    payload TEXT NOT NULL,
    version INTEGER NOT NULL,
    actor_id TEXT NOT NULL DEFAULT '',
    occurred_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(stream_id, version)
  )`,
  `CREATE TABLE IF NOT EXISTS cards (
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
  )`,
  `CREATE TABLE IF NOT EXISTS boards (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    columns TEXT NOT NULL DEFAULT '["todo","doing","done"]',
    created_by TEXT NOT NULL,
    owner TEXT NOT NULL DEFAULT '',
    visibility TEXT NOT NULL DEFAULT 'public',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS board_members (
    board_id TEXT NOT NULL,
    agent_id TEXT NOT NULL,
    added_at TEXT NOT NULL,
    PRIMARY KEY (board_id, agent_id)
  )`,
  `CREATE TABLE IF NOT EXISTS card_labels (
    card_id TEXT NOT NULL,
    label TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT '#888888',
    added_at TEXT NOT NULL,
    PRIMARY KEY (card_id, label)
  )`,
  `CREATE TABLE IF NOT EXISTS board_labels (
    id TEXT PRIMARY KEY,
    board_id TEXT NOT NULL,
    name TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT '#888888',
    created_at TEXT NOT NULL,
    UNIQUE(board_id, name)
  )`,
  `CREATE TABLE IF NOT EXISTS checklists (
    id TEXT PRIMARY KEY,
    card_id TEXT NOT NULL,
    title TEXT NOT NULL,
    position INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS checklist_items (
    id TEXT PRIMARY KEY,
    checklist_id TEXT NOT NULL,
    text TEXT NOT NULL,
    completed INTEGER NOT NULL DEFAULT 0,
    position INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS comments (
    id TEXT PRIMARY KEY,
    card_id TEXT NOT NULL,
    parent_comment_id TEXT,
    author_id TEXT NOT NULL,
    text TEXT NOT NULL,
    created_at TEXT NOT NULL
  )`,
] as const;

export const INDEXES = [
  'CREATE INDEX IF NOT EXISTS idx_events_stream ON events(stream_id, version)',
  'CREATE INDEX IF NOT EXISTS idx_cards_column ON cards(column_name, position)',
  'CREATE INDEX IF NOT EXISTS idx_checklists_card ON checklists(card_id)',
  'CREATE INDEX IF NOT EXISTS idx_checklist_items_checklist ON checklist_items(checklist_id)',
  'CREATE INDEX IF NOT EXISTS idx_comments_card ON comments(card_id)',
] as const;
