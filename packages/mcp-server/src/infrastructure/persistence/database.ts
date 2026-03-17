import Database from 'better-sqlite3';
import { TABLES, INDEXES } from './schema.js';

export function createDatabase(dbPath?: string): Database.Database {
  const db = new Database(dbPath ?? ':memory:');
  db.pragma('journal_mode = WAL');
  for (const table of TABLES) db.exec(table);
  for (const index of INDEXES) db.exec(index);
  migrateBoards(db);
  migrateBoardLabels(db);
  return db;
}

function migrateBoards(db: Database.Database): void {
  safeAlterTable(db, 'ALTER TABLE boards ADD COLUMN owner TEXT NOT NULL DEFAULT \'\'');
  safeAlterTable(db, 'ALTER TABLE boards ADD COLUMN visibility TEXT NOT NULL DEFAULT \'public\'');
  db.exec("UPDATE boards SET owner = created_by WHERE owner = ''");
}

function migrateBoardLabels(db: Database.Database): void {
  db.exec(`
    INSERT OR IGNORE INTO board_labels (id, board_id, name, color, created_at)
    SELECT
      lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' ||
        substr(hex(randomblob(2)),2) || '-' ||
        substr('89ab',abs(random()) % 4 + 1, 1) ||
        substr(hex(randomblob(2)),2) || '-' || hex(randomblob(6))),
      c.board_id, cl.label, cl.color, cl.added_at
    FROM card_labels cl
    JOIN cards c ON cl.card_id = c.id
    WHERE NOT EXISTS (
      SELECT 1 FROM board_labels bl
      WHERE bl.board_id = c.board_id AND bl.name = cl.label
    )
    GROUP BY c.board_id, cl.label
  `);
}

function safeAlterTable(db: Database.Database, sql: string): void {
  try {
    db.exec(sql);
  } catch {
    // Column already exists — safe to ignore
  }
}
