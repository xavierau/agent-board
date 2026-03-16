import type Database from 'better-sqlite3';
import type {
  CardReadModel,
  CardView,
} from '../../domain/repositories/card-read-model.js';

export class SqliteCardReadModel implements CardReadModel {
  private readonly upsertStmt: Database.Statement;
  private readonly byIdStmt: Database.Statement;
  private readonly byColumnStmt: Database.Statement;
  private readonly byBoardStmt: Database.Statement;
  private readonly allStmt: Database.Statement;
  private readonly archiveStmt: Database.Statement;
  private readonly assignStmt: Database.Statement;

  constructor(db: Database.Database) {
    this.upsertStmt = db.prepare(
      `INSERT OR REPLACE INTO cards
         (id, title, description, column_name, position, board_id, archived, assignee, labels, created_at, updated_at)
       VALUES (@id, @title, @description, @column, @position, @boardId, @archived, @assignee, @labels, @createdAt, @updatedAt)`,
    );
    this.byIdStmt = db.prepare('SELECT * FROM cards WHERE id = ?');
    this.byColumnStmt = db.prepare(
      'SELECT * FROM cards WHERE column_name = ? ORDER BY position',
    );
    this.byBoardStmt = db.prepare(
      'SELECT * FROM cards WHERE board_id = ? ORDER BY column_name, position',
    );
    this.allStmt = db.prepare(
      'SELECT * FROM cards ORDER BY column_name, position',
    );
    this.archiveStmt = db.prepare(
      'UPDATE cards SET archived = 1 WHERE id = ?',
    );
    this.assignStmt = db.prepare(
      'UPDATE cards SET assignee = ? WHERE id = ?',
    );
  }

  upsert(card: CardView): void {
    this.upsertStmt.run({
      id: card.id,
      title: card.title,
      description: card.description,
      column: card.column,
      position: card.position,
      boardId: card.boardId,
      archived: card.archived ? 1 : 0,
      assignee: card.assignee,
      labels: JSON.stringify(card.labels),
      createdAt: card.createdAt,
      updatedAt: card.updatedAt,
    });
  }

  findById(id: string): CardView | null {
    const row = this.byIdStmt.get(id) as CardRow | undefined;
    return row ? toCardView(row) : null;
  }

  findByColumn(column: string): CardView[] {
    const rows = this.byColumnStmt.all(column) as CardRow[];
    return rows.map(toCardView);
  }

  findByBoard(boardId: string): CardView[] {
    const rows = this.byBoardStmt.all(boardId) as CardRow[];
    return rows.map(toCardView);
  }

  findAll(): CardView[] {
    const rows = this.allStmt.all() as CardRow[];
    return rows.map(toCardView);
  }

  archive(id: string): void {
    this.archiveStmt.run(id);
  }

  assign(id: string, assigneeId: string | null): void {
    this.assignStmt.run(assigneeId, id);
  }
}

type CardRow = {
  id: string;
  title: string;
  description: string;
  column_name: string;
  position: number;
  board_id: string;
  archived: number;
  assignee: string | null;
  labels: string;
  created_at: string;
  updated_at: string;
};

function toCardView(row: CardRow): CardView {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    column: row.column_name,
    position: row.position,
    boardId: row.board_id,
    archived: row.archived === 1,
    assignee: row.assignee ?? null,
    labels: JSON.parse(row.labels),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
