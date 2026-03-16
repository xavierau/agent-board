import type Database from 'better-sqlite3';
import type {
  CommentReadModel,
  CommentView,
} from '../../domain/repositories/comment-read-model.js';

export class SqliteCommentReadModel implements CommentReadModel {
  private readonly insertStmt: Database.Statement;
  private readonly byCardStmt: Database.Statement;
  private readonly byIdStmt: Database.Statement;

  constructor(db: Database.Database) {
    this.insertStmt = db.prepare(
      `INSERT INTO comments (id, card_id, parent_comment_id, author_id, text, created_at)
       VALUES (@id, @cardId, @parentCommentId, @authorId, @text, @createdAt)`,
    );
    this.byCardStmt = db.prepare(
      'SELECT * FROM comments WHERE card_id = ? ORDER BY created_at',
    );
    this.byIdStmt = db.prepare('SELECT * FROM comments WHERE id = ?');
  }

  insert(comment: CommentView): void {
    this.insertStmt.run({
      id: comment.id,
      cardId: comment.cardId,
      parentCommentId: comment.parentCommentId,
      authorId: comment.authorId,
      text: comment.text,
      createdAt: comment.createdAt,
    });
  }

  findByCard(cardId: string): CommentView[] {
    const rows = this.byCardStmt.all(cardId) as CommentRow[];
    return rows.map(toCommentView);
  }

  findById(id: string): CommentView | null {
    const row = this.byIdStmt.get(id) as CommentRow | undefined;
    return row ? toCommentView(row) : null;
  }
}

type CommentRow = {
  id: string;
  card_id: string;
  parent_comment_id: string | null;
  author_id: string;
  text: string;
  created_at: string;
};

function toCommentView(row: CommentRow): CommentView {
  return {
    id: row.id,
    cardId: row.card_id,
    parentCommentId: row.parent_comment_id,
    authorId: row.author_id,
    text: row.text,
    createdAt: row.created_at,
  };
}
