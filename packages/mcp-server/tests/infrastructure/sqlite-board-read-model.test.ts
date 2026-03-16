import { describe, it, expect, beforeEach } from 'vitest';
import { createDatabase } from '../../src/infrastructure/persistence/database.js';
import { SqliteBoardReadModel } from '../../src/infrastructure/persistence/sqlite-board-read-model.js';
import type { BoardView } from '../../src/domain/repositories/board-read-model.js';
import type Database from 'better-sqlite3';

describe('SqliteBoardReadModel', () => {
  let db: Database.Database;
  let model: SqliteBoardReadModel;

  const board: BoardView = {
    id: 'board-1',
    name: 'Sprint Board',
    columns: ['todo', 'doing', 'done'],
    createdBy: 'user-1',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };

  beforeEach(() => {
    db = createDatabase();
    model = new SqliteBoardReadModel(db);
  });

  it('upserts and finds by id', () => {
    model.upsert(board);
    expect(model.findById('board-1')).toEqual(board);
  });

  it('returns null for unknown id', () => {
    expect(model.findById('nonexistent')).toBeNull();
  });

  it('findAll returns all boards', () => {
    model.upsert(board);
    model.upsert({ ...board, id: 'board-2', name: 'Other' });
    expect(model.findAll()).toHaveLength(2);
  });

  it('findAll returns empty array when no boards', () => {
    expect(model.findAll()).toEqual([]);
  });

  it('upsert updates existing board', () => {
    model.upsert(board);
    model.upsert({ ...board, name: 'Renamed' });

    const found = model.findById('board-1');
    expect(found?.name).toBe('Renamed');
  });

  it('stores and retrieves columns as JSON', () => {
    const custom = { ...board, columns: ['backlog', 'in-progress', 'review', 'done'] };
    model.upsert(custom);

    const found = model.findById('board-1');
    expect(found?.columns).toEqual(['backlog', 'in-progress', 'review', 'done']);
  });
});
