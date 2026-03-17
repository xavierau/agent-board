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
    owner: 'user-1',
    visibility: 'public',
    members: [],
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
    expect(model.findById('board-1')?.name).toBe('Renamed');
  });

  it('stores and retrieves columns as JSON', () => {
    const custom = { ...board, columns: ['backlog', 'in-progress', 'review', 'done'] };
    model.upsert(custom);
    expect(model.findById('board-1')?.columns).toEqual(['backlog', 'in-progress', 'review', 'done']);
  });

  it('updateOwner changes the board owner', () => {
    model.upsert(board);
    model.updateOwner('board-1', 'user-2');
    expect(model.findById('board-1')?.owner).toBe('user-2');
  });

  it('updateVisibility changes the board visibility', () => {
    model.upsert(board);
    model.updateVisibility('board-1', 'private');
    expect(model.findById('board-1')?.visibility).toBe('private');
  });

  it('addMember adds a member to the board', () => {
    model.upsert(board);
    model.addMember('board-1', 'agent-1');
    const found = model.findById('board-1');
    expect(found?.members).toEqual(['agent-1']);
  });

  it('removeMember removes a member from the board', () => {
    model.upsert(board);
    model.addMember('board-1', 'agent-1');
    model.addMember('board-1', 'agent-2');
    model.removeMember('board-1', 'agent-1');
    expect(model.findById('board-1')?.members).toEqual(['agent-2']);
  });

  it('addMember is idempotent', () => {
    model.upsert(board);
    model.addMember('board-1', 'agent-1');
    model.addMember('board-1', 'agent-1');
    expect(model.findById('board-1')?.members).toEqual(['agent-1']);
  });
});
