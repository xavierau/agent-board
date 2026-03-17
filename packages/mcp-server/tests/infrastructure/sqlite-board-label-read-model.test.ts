import { describe, it, expect, beforeEach } from 'vitest';
import { createDatabase } from '../../src/infrastructure/persistence/database.js';
import { SqliteBoardLabelReadModel } from '../../src/infrastructure/persistence/sqlite-board-label-read-model.js';
import type { BoardLabel } from '../../src/domain/repositories/board-label-read-model.js';
import type Database from 'better-sqlite3';

describe('SqliteBoardLabelReadModel', () => {
  let db: Database.Database;
  let model: SqliteBoardLabelReadModel;

  const label: BoardLabel = {
    id: 'label-1',
    boardId: 'board-1',
    name: 'bug',
    color: '#cf222e',
    createdAt: '2026-01-01T00:00:00.000Z',
  };

  beforeEach(() => {
    db = createDatabase();
    model = new SqliteBoardLabelReadModel(db);
  });

  it('creates and finds by id', () => {
    model.create(label);
    const found = model.findById('label-1');
    expect(found).toEqual(label);
  });

  it('returns null for unknown id', () => {
    expect(model.findById('nonexistent')).toBeNull();
  });

  it('finds labels by board', () => {
    model.create(label);
    model.create({ ...label, id: 'label-2', boardId: 'board-2', name: 'feature' });

    const results = model.findByBoard('board-1');
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('bug');
  });

  it('finds by board and name', () => {
    model.create(label);
    const found = model.findByBoardAndName('board-1', 'bug');
    expect(found).toEqual(label);
  });

  it('returns null for unknown board+name', () => {
    expect(model.findByBoardAndName('board-1', 'nope')).toBeNull();
  });

  it('updates name and color', () => {
    model.create(label);
    model.update('label-1', 'critical-bug', '#ff0000');

    const found = model.findById('label-1');
    expect(found?.name).toBe('critical-bug');
    expect(found?.color).toBe('#ff0000');
  });

  it('removes a label', () => {
    model.create(label);
    model.remove('label-1');
    expect(model.findById('label-1')).toBeNull();
  });

  it('removes by board and name', () => {
    model.create(label);
    model.removeByBoardAndName('board-1', 'bug');
    expect(model.findById('label-1')).toBeNull();
  });

  it('enforces unique board+name', () => {
    model.create(label);
    expect(() =>
      model.create({ ...label, id: 'label-dup' }),
    ).toThrow();
  });

  it('returns labels ordered by name', () => {
    model.create(label);
    model.create({ ...label, id: 'label-2', name: 'alpha' });

    const results = model.findByBoard('board-1');
    expect(results[0].name).toBe('alpha');
    expect(results[1].name).toBe('bug');
  });
});
