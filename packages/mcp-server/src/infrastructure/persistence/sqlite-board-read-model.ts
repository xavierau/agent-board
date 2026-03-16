import type Database from 'better-sqlite3';
import type {
  BoardReadModel,
  BoardView,
} from '../../domain/repositories/board-read-model.js';

export class SqliteBoardReadModel implements BoardReadModel {
  private readonly upsertStmt: Database.Statement;
  private readonly byIdStmt: Database.Statement;
  private readonly allStmt: Database.Statement;

  constructor(db: Database.Database) {
    this.upsertStmt = db.prepare(
      `INSERT OR REPLACE INTO boards
         (id, name, columns, created_by, created_at, updated_at)
       VALUES (@id, @name, @columns, @createdBy, @createdAt, @updatedAt)`,
    );
    this.byIdStmt = db.prepare('SELECT * FROM boards WHERE id = ?');
    this.allStmt = db.prepare('SELECT * FROM boards ORDER BY created_at');
  }

  upsert(board: BoardView): void {
    this.upsertStmt.run({
      id: board.id,
      name: board.name,
      columns: JSON.stringify(board.columns),
      createdBy: board.createdBy,
      createdAt: board.createdAt,
      updatedAt: board.updatedAt,
    });
  }

  findById(id: string): BoardView | null {
    const row = this.byIdStmt.get(id) as BoardRow | undefined;
    return row ? toBoardView(row) : null;
  }

  findAll(): BoardView[] {
    const rows = this.allStmt.all() as BoardRow[];
    return rows.map(toBoardView);
  }
}

type BoardRow = {
  id: string;
  name: string;
  columns: string;
  created_by: string;
  created_at: string;
  updated_at: string;
};

function toBoardView(row: BoardRow): BoardView {
  return {
    id: row.id,
    name: row.name,
    columns: JSON.parse(row.columns),
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
