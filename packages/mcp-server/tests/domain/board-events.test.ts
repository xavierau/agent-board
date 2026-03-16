import { describe, it, expect } from 'vitest';
import { createBoardCreatedEvent } from '../../src/domain/events/board-events.js';

describe('createBoardCreatedEvent', () => {
  it('creates event with name and columns', () => {
    const event = createBoardCreatedEvent({
      streamId: 'board-1',
      actorId: 'backend-engineer',
      name: 'My Board',
      columns: ['todo', 'doing', 'done'],
    });

    expect(event.type).toBe('BoardCreated');
    expect(event.streamId).toBe('board-1');
    expect(event.actorId).toBe('backend-engineer');
    expect(event.version).toBe(1);
    expect(event.payload.name).toBe('My Board');
    expect(event.payload.columns).toEqual(['todo', 'doing', 'done']);
    expect(event.occurredAt).toBeTruthy();
  });
});
