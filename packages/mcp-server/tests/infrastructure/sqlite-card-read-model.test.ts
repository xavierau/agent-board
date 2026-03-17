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

    const result = model.findByColumn('todo');
    expect(result.items).toHaveLength(1);
    expect(result.items[0].id).toBe('card-1');
    expect(result.total).toBe(1);
  });

  it('findAll returns all cards', () => {
    model.upsert(card);
    model.upsert({ ...card, id: 'card-2', column: 'doing' });

    const result = model.findAll();
    expect(result.items).toHaveLength(2);
    expect(result.total).toBe(2);
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

    const result = model.findByBoard('board-1');
    expect(result.items).toHaveLength(1);
    expect(result.items[0].id).toBe('card-1');
    expect(result.total).toBe(1);
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

  describe('pagination', () => {
    beforeEach(() => {
      for (let i = 0; i < 5; i++) {
        model.upsert({
          ...card,
          id: `card-${i}`,
          position: i,
        });
      }
    });

    it('defaults to page 1 and pageSize 50', () => {
      const result = model.findAll();
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(50);
      expect(result.items).toHaveLength(5);
      expect(result.total).toBe(5);
    });

    it('paginates with custom page and pageSize', () => {
      const page1 = model.findAll({ page: 1, pageSize: 2 });
      expect(page1.items).toHaveLength(2);
      expect(page1.total).toBe(5);
      expect(page1.page).toBe(1);
      expect(page1.pageSize).toBe(2);

      const page2 = model.findAll({ page: 2, pageSize: 2 });
      expect(page2.items).toHaveLength(2);

      const page3 = model.findAll({ page: 3, pageSize: 2 });
      expect(page3.items).toHaveLength(1);
    });

    it('returns empty items for page beyond data', () => {
      const result = model.findAll({ page: 10, pageSize: 2 });
      expect(result.items).toHaveLength(0);
      expect(result.total).toBe(5);
    });

    it('paginates findByColumn', () => {
      const result = model.findByColumn('todo', { page: 1, pageSize: 2 });
      expect(result.items).toHaveLength(2);
      expect(result.total).toBe(5);
    });

    it('paginates findByBoard', () => {
      const result = model.findByBoard('board-1', { page: 1, pageSize: 3 });
      expect(result.items).toHaveLength(3);
      expect(result.total).toBe(5);
    });
  });
});
