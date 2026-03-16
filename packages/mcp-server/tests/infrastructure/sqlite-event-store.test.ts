import { describe, it, expect, beforeEach } from 'vitest';
import { createDatabase } from '../../src/infrastructure/persistence/database.js';
import { SqliteEventStore } from '../../src/infrastructure/persistence/sqlite-event-store.js';
import {
  createCardCreatedEvent,
  createCardMovedEvent,
} from '../../src/domain/events/card-events.js';
import type Database from 'better-sqlite3';

describe('SqliteEventStore', () => {
  let db: Database.Database;
  let store: SqliteEventStore;

  beforeEach(() => {
    db = createDatabase();
    store = new SqliteEventStore(db);
  });

  it('appends and retrieves events by stream', () => {
    const event = createCardCreatedEvent({
      streamId: 'card-1',
      actorId: 'test-actor',
      title: 'Test',
      description: '',
      column: 'todo',
      position: 0,
      boardId: 'board-1',
    });

    store.append(event);
    const stream = store.getStream('card-1');

    expect(stream).toHaveLength(1);
    expect(stream[0].type).toBe('CardCreated');
    expect(stream[0].streamId).toBe('card-1');
    expect(stream[0].actorId).toBe('test-actor');
    expect(stream[0].payload).toEqual(event.payload);
  });

  it('returns empty array for unknown stream', () => {
    expect(store.getStream('nonexistent')).toEqual([]);
  });

  it('returns events ordered by version', () => {
    const created = createCardCreatedEvent({
      streamId: 'card-1',
      actorId: 'test-actor',
      title: 'Test',
      description: '',
      column: 'todo',
      position: 0,
      boardId: 'board-1',
    });
    const moved = createCardMovedEvent({
      streamId: 'card-1',
      actorId: 'test-actor',
      version: 2,
      fromColumn: 'todo',
      toColumn: 'doing',
      position: 0,
    });

    store.append(created);
    store.append(moved);
    const stream = store.getStream('card-1');

    expect(stream).toHaveLength(2);
    expect(stream[0].version).toBe(1);
    expect(stream[1].version).toBe(2);
  });

  it('getAllEvents returns all events ordered by id', () => {
    const e1 = createCardCreatedEvent({
      streamId: 'card-1',
      actorId: 'test-actor',
      title: 'First',
      description: '',
      column: 'todo',
      position: 0,
      boardId: 'board-1',
    });
    const e2 = createCardCreatedEvent({
      streamId: 'card-2',
      actorId: 'test-actor',
      title: 'Second',
      description: '',
      column: 'doing',
      position: 0,
      boardId: 'board-1',
    });

    store.append(e1);
    store.append(e2);
    const all = store.getAllEvents();

    expect(all).toHaveLength(2);
    expect(all[0].streamId).toBe('card-1');
    expect(all[1].streamId).toBe('card-2');
  });
});
