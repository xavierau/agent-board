import { describe, it, expect, beforeEach } from 'vitest';
import { createDatabase } from '../../src/infrastructure/persistence/database.js';
import { SqliteEventStore } from '../../src/infrastructure/persistence/sqlite-event-store.js';
import { SqliteCardReadModel } from '../../src/infrastructure/persistence/sqlite-card-read-model.js';
import { CardProjection } from '../../src/application/projections/card-projection.js';
import { CreateCardUseCase } from '../../src/application/use-cases/create-card.js';
import { ListEventsUseCase } from '../../src/application/use-cases/list-events.js';
import type Database from 'better-sqlite3';

const ACTOR = 'user-1';
const BOARD = 'board-1';

describe('ListEventsUseCase', () => {
  let db: Database.Database;
  let createCard: CreateCardUseCase;
  let listEvents: ListEventsUseCase;

  beforeEach(() => {
    db = createDatabase(':memory:');
    const eventStore = new SqliteEventStore(db);
    const cardReadModel = new SqliteCardReadModel(db);
    const cardProjection = new CardProjection(cardReadModel);
    createCard = new CreateCardUseCase(eventStore, cardReadModel, cardProjection);
    listEvents = new ListEventsUseCase(eventStore);
  });

  it('returns empty array when no events exist', () => {
    const events = listEvents.execute({});
    expect(events).toEqual([]);
  });

  it('returns all events with correct shape', () => {
    createCard.execute({ title: 'Card 1', column: 'todo', boardId: BOARD, actorId: ACTOR });

    const events = listEvents.execute({});
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      id: expect.any(Number),
      streamId: expect.any(String),
      eventType: 'CardCreated',
      payload: expect.objectContaining({ title: 'Card 1' }),
      actorId: ACTOR,
      occurredAt: expect.any(String),
    });
  });

  it('filters by sinceId', () => {
    createCard.execute({ title: 'Card 1', column: 'todo', boardId: BOARD, actorId: ACTOR });
    createCard.execute({ title: 'Card 2', column: 'todo', boardId: BOARD, actorId: ACTOR });
    createCard.execute({ title: 'Card 3', column: 'todo', boardId: BOARD, actorId: ACTOR });

    const allEvents = listEvents.execute({});
    expect(allEvents).toHaveLength(3);

    const sinceFirst = listEvents.execute({ sinceId: allEvents[0].id });
    expect(sinceFirst).toHaveLength(2);
    expect(sinceFirst[0].payload).toMatchObject({ title: 'Card 2' });
    expect(sinceFirst[1].payload).toMatchObject({ title: 'Card 3' });
  });

  it('respects limit', () => {
    createCard.execute({ title: 'Card 1', column: 'todo', boardId: BOARD, actorId: ACTOR });
    createCard.execute({ title: 'Card 2', column: 'todo', boardId: BOARD, actorId: ACTOR });
    createCard.execute({ title: 'Card 3', column: 'todo', boardId: BOARD, actorId: ACTOR });

    const events = listEvents.execute({ limit: 2 });
    expect(events).toHaveLength(2);
    expect(events[0].payload).toMatchObject({ title: 'Card 1' });
    expect(events[1].payload).toMatchObject({ title: 'Card 2' });
  });

  it('combines sinceId and limit', () => {
    createCard.execute({ title: 'Card 1', column: 'todo', boardId: BOARD, actorId: ACTOR });
    createCard.execute({ title: 'Card 2', column: 'todo', boardId: BOARD, actorId: ACTOR });
    createCard.execute({ title: 'Card 3', column: 'todo', boardId: BOARD, actorId: ACTOR });

    const allEvents = listEvents.execute({});
    const events = listEvents.execute({ sinceId: allEvents[0].id, limit: 1 });
    expect(events).toHaveLength(1);
    expect(events[0].payload).toMatchObject({ title: 'Card 2' });
  });

  it('defaults sinceId to 0 and limit to 100', () => {
    createCard.execute({ title: 'Card 1', column: 'todo', boardId: BOARD, actorId: ACTOR });

    const events = listEvents.execute({});
    expect(events).toHaveLength(1);
    expect(events[0].id).toBeGreaterThan(0);
  });

  it('returns events ordered by id ascending', () => {
    createCard.execute({ title: 'Card 1', column: 'todo', boardId: BOARD, actorId: ACTOR });
    createCard.execute({ title: 'Card 2', column: 'todo', boardId: BOARD, actorId: ACTOR });

    const events = listEvents.execute({});
    expect(events[0].id).toBeLessThan(events[1].id);
  });
});
