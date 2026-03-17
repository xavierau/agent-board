import type Database from 'better-sqlite3';
import type {
  BoardReadModel,
  BoardView,
} from '../../domain/repositories/board-read-model.js';

export class SqliteBoardReadModel implements BoardReadModel {
  private readonly db: Database.Database;
  private readonly upsertStmt: Database.Statement;
  private readonly byIdStmt: Database.Statement;
  private readonly allStmt: Database.Statement;
  private readonly updateOwnerStmt: Database.Statement;
  private readonly updateVisibilityStmt: Database.Statement;
  private readonly addMemberStmt: Database.Statement;
  private readonly removeMemberStmt: Database.Statement;
  private readonly membersStmt: Database.Statement;

  constructor(db: Database.Database) {
    this.db = db;
    this.upsertStmt = db.prepare(
      `INSERT OR REPLACE INTO boards
         (id, name, columns, created_by, owner, visibility, created_at, updated_at)
       VALUES (@id, @name, @columns, @createdBy, @owner, @visibility, @createdAt, @updatedAt)`,
    );
    this.byIdStmt = db.prepare('SELECT * FROM boards WHERE id = ?');
    this.allStmt = db.prepare('SELECT * FROM boards ORDER BY created_at');
    this.updateOwnerStmt = db.prepare('UPDATE boards SET owner = ? WHERE id = ?');
    this.updateVisibilityStmt = db.prepare('UPDATE boards SET visibility = ? WHERE id = ?');
    this.addMemberStmt = db.prepare(
      `INSERT OR IGNORE INTO board_members (board_id, agent_id, added_at)
       VALUES (?, ?, ?)`,
    );
    this.removeMemberStmt = db.prepare(
      'DELETE FROM board_members WHERE board_id = ? AND agent_id = ?',
    );
    this.membersStmt = db.prepare(
      'SELECT agent_id FROM board_members WHERE board_id = ? ORDER BY added_at',
    );
  }

  upsert(board: BoardView): void {
    this.upsertStmt.run({
      id: board.id,
      name: board.name,
      columns: JSON.stringify(board.columns),
      createdBy: board.createdBy,
      owner: board.owner,
      visibility: board.visibility,
      createdAt: board.createdAt,
      updatedAt: board.updatedAt,
    });
  }

  findById(id: string): BoardView | null {
    const row = this.byIdStmt.get(id) as BoardRow | undefined;
    if (!row) return null;
    return toBoardView(row, this.getMembers(id));
  }

  findAll(): BoardView[] {
    const rows = this.allStmt.all() as BoardRow[];
    return rows.map(r => toBoardView(r, this.getMembers(r.id)));
  }

  updateOwner(boardId: string, owner: string): void {
    this.updateOwnerStmt.run(owner, boardId);
  }

  updateVisibility(boardId: string, visibility: 'public' | 'private'): void {
    this.updateVisibilityStmt.run(visibility, boardId);
  }

  addMember(boardId: string, agentId: string): void {
    this.addMemberStmt.run(boardId, agentId, new Date().toISOString());
  }

  removeMember(boardId: string, agentId: string): void {
    this.removeMemberStmt.run(boardId, agentId);
  }

  private getMembers(boardId: string): string[] {
    const rows = this.membersStmt.all(boardId) as { agent_id: string }[];
    return rows.map(r => r.agent_id);
  }
}

type BoardRow = {
  id: string;
  name: string;
  columns: string;
  created_by: string;
  owner: string;
  visibility: string;
  created_at: string;
  updated_at: string;
};

function toBoardView(row: BoardRow, members: string[]): BoardView {
  return {
    id: row.id,
    name: row.name,
    columns: JSON.parse(row.columns),
    createdBy: row.created_by,
    owner: row.owner,
    visibility: row.visibility as 'public' | 'private',
    members,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
