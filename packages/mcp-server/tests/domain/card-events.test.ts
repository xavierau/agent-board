import { describe, it, expect } from 'vitest';
import {
  createCardCreatedEvent,
  createCardMovedEvent,
} from '../../src/domain/events/card-events.js';

describe('createCardCreatedEvent', () => {
  it('creates event with correct type and payload', () => {
    const event = createCardCreatedEvent({
      streamId: 'card-1',
      actorId: 'test-actor',
      title: 'My Task',
      description: 'A description',
      column: 'todo',
      position: 0,
      boardId: 'board-1',
    });

    expect(event.type).toBe('CardCreated');
    expect(event.streamId).toBe('card-1');
    expect(event.version).toBe(1);
    expect(event.actorId).toBe('test-actor');
    expect(event.payload.title).toBe('My Task');
    expect(event.payload.description).toBe('A description');
    expect(event.payload.column).toBe('todo');
    expect(event.payload.position).toBe(0);
    expect(event.payload.boardId).toBe('board-1');
    expect(event.occurredAt).toBeTruthy();
  });
});

describe('createCardMovedEvent', () => {
  it('creates event with correct type and payload', () => {
    const event = createCardMovedEvent({
      streamId: 'card-1',
      actorId: 'test-actor',
      version: 2,
      fromColumn: 'todo',
      toColumn: 'doing',
      position: 1,
    });

    expect(event.type).toBe('CardMoved');
    expect(event.streamId).toBe('card-1');
    expect(event.version).toBe(2);
    expect(event.actorId).toBe('test-actor');
    expect(event.payload.fromColumn).toBe('todo');
    expect(event.payload.toColumn).toBe('doing');
    expect(event.payload.position).toBe(1);
    expect(event.occurredAt).toBeTruthy();
  });
});
