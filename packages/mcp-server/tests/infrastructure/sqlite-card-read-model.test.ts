import { describe, it, expect, beforeEach } from 'vitest';
import { createDatabase } from '../../src/infrastructure/persistence/database.js';
import { SqliteCardReadModel } from '../../src/infrastructure/persistence/sqlite-card-read-model.js';
import type { CardView } from '../../src/domain/repositories/card-read-model.js';
import type Database from 'better-sqlite3';

describe('SqliteCardReadModel', () => {
  let db: Database.Database;
  let model: SqliteCardReadModel;

  const card: CardView = {
    id: 'card-1',
    title: 'Test Card',
    description: 'A test',
    column: 'todo',
    position: 0,
    boardId: 'board-1',
    archived: false,
    assignee: null,
    labels: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };

  beforeEach(() => {
    db = createDatabase();
    model = new SqliteCardReadModel(db);
  });

  it('upserts and finds by id', () => {
    model.upsert(card);
    const found = model.findById('card-1');

    expect(found).toEqual(card);
  });

  it('returns null for unknown id', () => {
    expect(model.findById('nonexistent')).toBeNull();
  });

  it('finds cards by column', () => {
    model.upsert(card);
    model.upsert({ ...card, id: 'card-2', column: 'doing' });

    const todoCards = model.findByColumn('todo');
    expect(todoCards).toHaveLength(1);
    expect(todoCards[0].id).toBe('card-1');
  });

  it('findAll returns all cards', () => {
    model.upsert(card);
    model.upsert({ ...card, id: 'card-2', column: 'doing' });

    expect(model.findAll()).toHaveLength(2);
  });

  it('upsert updates existing card', () => {
    model.upsert(card);
    model.upsert({ ...card, title: 'Updated' });

    const found = model.findById('card-1');
    expect(found?.title).toBe('Updated');
  });

  it('finds cards by board', () => {
    model.upsert(card);
    model.upsert({ ...card, id: 'card-2', boardId: 'board-2' });

    const boardCards = model.findByBoard('board-1');
    expect(boardCards).toHaveLength(1);
    expect(boardCards[0].id).toBe('card-1');
  });

  it('archives a card', () => {
    model.upsert(card);
    model.archive('card-1');

    const found = model.findById('card-1');
    expect(found?.archived).toBe(true);
  });

  it('stores and retrieves labels', () => {
    const labeled = {
      ...card,
      labels: [{ label: 'bug', color: 'red' }],
    };
    model.upsert(labeled);

    const found = model.findById('card-1');
    expect(found?.labels).toEqual([{ label: 'bug', color: 'red' }]);
  });
});
