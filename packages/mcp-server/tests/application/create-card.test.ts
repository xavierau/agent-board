import { describe, it, expect, beforeEach } from 'vitest';
import { createDatabase } from '../../src/infrastructure/persistence/database.js';
import { SqliteEventStore } from '../../src/infrastructure/persistence/sqlite-event-store.js';
import { SqliteCardReadModel } from '../../src/infrastructure/persistence/sqlite-card-read-model.js';
import { CardProjection } from '../../src/application/projections/card-projection.js';
import { CreateCardUseCase } from '../../src/application/use-cases/create-card.js';
import type Database from 'better-sqlite3';

const ACTOR = 'user-1';
const BOARD = 'board-1';

describe('CreateCardUseCase', () => {
  let db: Database.Database;
  let useCase: CreateCardUseCase;
  let eventStore: SqliteEventStore;
  let readModel: SqliteCardReadModel;

  beforeEach(() => {
    db = createDatabase();
    eventStore = new SqliteEventStore(db);
    readModel = new SqliteCardReadModel(db);
    const projection = new CardProjection(readModel);
    useCase = new CreateCardUseCase(eventStore, readModel, projection);
  });

  it('creates a card with default column', () => {
    const result = useCase.execute({
      title: 'My Task',
      actorId: ACTOR,
      boardId: BOARD,
    });

    expect(result.title).toBe('My Task');
    expect(result.column).toBe('todo');
    expect(result.cardId).toBeTruthy();
  });

  it('creates a card in a specific column', () => {
    const result = useCase.execute({
      title: 'Doing Task',
      column: 'doing',
      actorId: ACTOR,
      boardId: BOARD,
    });

    expect(result.column).toBe('doing');
  });

  it('persists event to event store', () => {
    const result = useCase.execute({
      title: 'Persisted',
      actorId: ACTOR,
      boardId: BOARD,
    });
    const events = eventStore.getStream(result.cardId);

    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('CardCreated');
  });

  it('persists card to read model', () => {
    const result = useCase.execute({
      title: 'Readable',
      description: 'desc',
      actorId: ACTOR,
      boardId: BOARD,
    });
    const card = readModel.findById(result.cardId);

    expect(card).not.toBeNull();
    expect(card?.title).toBe('Readable');
    expect(card?.description).toBe('desc');
    expect(card?.boardId).toBe(BOARD);
  });
});
