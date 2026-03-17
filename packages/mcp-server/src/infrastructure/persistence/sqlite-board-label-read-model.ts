import type Database from 'better-sqlite3';
import type {
  BoardLabelReadModel,
  BoardLabel,
} from '../../domain/repositories/board-label-read-model.js';

export class SqliteBoardLabelReadModel implements BoardLabelReadModel {
  private readonly createStmt: Database.Statement;
  private readonly updateStmt: Database.Statement;
  private readonly removeStmt: Database.Statement;
  private readonly removeByBoardNameStmt: Database.Statement;
  private readonly byIdStmt: Database.Statement;
  private readonly byBoardStmt: Database.Statement;
  private readonly byBoardNameStmt: Database.Statement;

  constructor(db: Database.Database) {
    this.createStmt = db.prepare(
      `INSERT INTO board_labels (id, board_id, name, color, created_at)
       VALUES (?, ?, ?, ?, ?)`,
    );
    this.updateStmt = db.prepare(
      'UPDATE board_labels SET name = ?, color = ? WHERE id = ?',
    );
    this.removeStmt = db.prepare('DELETE FROM board_labels WHERE id = ?');
    this.removeByBoardNameStmt = db.prepare(
      'DELETE FROM board_labels WHERE board_id = ? AND name = ?',
    );
    this.byIdStmt = db.prepare('SELECT * FROM board_labels WHERE id = ?');
    this.byBoardStmt = db.prepare(
      'SELECT * FROM board_labels WHERE board_id = ? ORDER BY name',
    );
    this.byBoardNameStmt = db.prepare(
      'SELECT * FROM board_labels WHERE board_id = ? AND name = ?',
    );
  }

  create(label: BoardLabel): void {
    this.createStmt.run(
      label.id, label.boardId, label.name, label.color, label.createdAt,
    );
  }

  update(id: string, name: string, color: string): void {
    this.updateStmt.run(name, color, id);
  }

  remove(id: string): void {
    this.removeStmt.run(id);
  }

  removeByBoardAndName(boardId: string, name: string): void {
    this.removeByBoardNameStmt.run(boardId, name);
  }

  findById(id: string): BoardLabel | null {
    const row = this.byIdStmt.get(id) as BoardLabelRow | undefined;
    return row ? toLabel(row) : null;
  }

  findByBoard(boardId: string): BoardLabel[] {
    const rows = this.byBoardStmt.all(boardId) as BoardLabelRow[];
    return rows.map(toLabel);
  }

  findByBoardAndName(boardId: string, name: string): BoardLabel | null {
    const row = this.byBoardNameStmt.get(boardId, name) as BoardLabelRow | undefined;
    return row ? toLabel(row) : null;
  }
}

type BoardLabelRow = {
  id: string;
  board_id: string;
  name: string;
  color: string;
  created_at: string;
};

function toLabel(row: BoardLabelRow): BoardLabel {
  return {
    id: row.id,
    boardId: row.board_id,
    name: row.name,
    color: row.color,
    createdAt: row.created_at,
  };
}
