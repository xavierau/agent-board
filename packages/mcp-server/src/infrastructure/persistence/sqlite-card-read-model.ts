import type Database from 'better-sqlite3';
import type {
  CardReadModel,
  CardView,
  PaginatedResult,
  PaginationInput,
} from '../../domain/repositories/card-read-model.js';

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 50;

export class SqliteCardReadModel implements CardReadModel {
  private readonly upsertStmt: Database.Statement;
  private readonly byIdStmt: Database.Statement;
  private readonly archiveStmt: Database.Statement;
  private readonly assignStmt: Database.Statement;
  private readonly db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
    this.upsertStmt = db.prepare(
      `INSERT OR REPLACE INTO cards
         (id, title, description, column_name, position, board_id, archived, assignee, labels, created_at, updated_at)
       VALUES (@id, @title, @description, @column, @position, @boardId, @archived, @assignee, @labels, @createdAt, @updatedAt)`,
    );
    this.byIdStmt = db.prepare('SELECT * FROM cards WHERE id = ?');
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

  findByColumn(
    column: string,
    pagination?: PaginationInput,
  ): PaginatedResult<CardView> {
    return this.paginate(
      'WHERE column_name = ?',
      'ORDER BY position',
      [column],
      pagination,
    );
  }

  findByBoard(
    boardId: string,
    pagination?: PaginationInput,
  ): PaginatedResult<CardView> {
    return this.paginate(
      'WHERE board_id = ?',
      'ORDER BY column_name, position',
      [boardId],
      pagination,
    );
  }

  findAll(pagination?: PaginationInput): PaginatedResult<CardView> {
    return this.paginate(
      '',
      'ORDER BY column_name, position',
      [],
      pagination,
    );
  }

  archive(id: string): void {
    this.archiveStmt.run(id);
  }

  assign(id: string, assigneeId: string | null): void {
    this.assignStmt.run(assigneeId, id);
  }

  private paginate(
    whereClause: string,
    orderClause: string,
    params: unknown[],
    pagination?: PaginationInput,
  ): PaginatedResult<CardView> {
    const page = pagination?.page ?? DEFAULT_PAGE;
    const pageSize = pagination?.pageSize ?? DEFAULT_PAGE_SIZE;
    const offset = (page - 1) * pageSize;

    const countSql = `SELECT COUNT(*) as cnt FROM cards ${whereClause}`;
    const countRow = this.db.prepare(countSql).get(...params) as { cnt: number };
    const total = countRow.cnt;

    const dataSql = `SELECT * FROM cards ${whereClause} ${orderClause} LIMIT ? OFFSET ?`;
    const rows = this.db.prepare(dataSql).all(...params, pageSize, offset) as CardRow[];

    return { items: rows.map(toCardView), total, page, pageSize };
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
