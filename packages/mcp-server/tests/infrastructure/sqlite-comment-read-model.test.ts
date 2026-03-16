import { describe, it, expect, beforeEach } from 'vitest';
import { createDatabase } from '../../src/infrastructure/persistence/database.js';
import { SqliteCommentReadModel } from '../../src/infrastructure/persistence/sqlite-comment-read-model.js';
import type { CommentView } from '../../src/domain/repositories/comment-read-model.js';
import type Database from 'better-sqlite3';

describe('SqliteCommentReadModel', () => {
  let db: Database.Database;
  let model: SqliteCommentReadModel;

  const comment: CommentView = {
    id: 'comment-1',
    cardId: 'card-1',
    parentCommentId: null,
    authorId: 'user-1',
    text: 'Looks good!',
    createdAt: '2026-01-01T00:00:00.000Z',
  };

  beforeEach(() => {
    db = createDatabase();
    model = new SqliteCommentReadModel(db);
  });

  it('inserts and finds by id', () => {
    model.insert(comment);
    expect(model.findById('comment-1')).toEqual(comment);
  });

  it('returns null for unknown id', () => {
    expect(model.findById('nonexistent')).toBeNull();
  });

  it('finds comments by card', () => {
    model.insert(comment);
    model.insert({ ...comment, id: 'comment-2', text: 'Also good' });

    const comments = model.findByCard('card-1');
    expect(comments).toHaveLength(2);
  });

  it('returns empty array for card with no comments', () => {
    expect(model.findByCard('card-1')).toEqual([]);
  });

  it('does not mix comments between cards', () => {
    model.insert(comment);
    model.insert({ ...comment, id: 'comment-2', cardId: 'card-2' });

    expect(model.findByCard('card-1')).toHaveLength(1);
    expect(model.findByCard('card-2')).toHaveLength(1);
  });

  it('stores parent comment id for replies', () => {
    model.insert(comment);
    const reply: CommentView = {
      id: 'comment-2',
      cardId: 'card-1',
      parentCommentId: 'comment-1',
      authorId: 'user-2',
      text: 'Thanks!',
      createdAt: '2026-01-01T01:00:00.000Z',
    };
    model.insert(reply);

    const found = model.findById('comment-2');
    expect(found?.parentCommentId).toBe('comment-1');
  });

  it('handles null parent comment id', () => {
    model.insert(comment);
    const found = model.findById('comment-1');
    expect(found?.parentCommentId).toBeNull();
  });
});
