import { describe, it, expect, beforeEach } from 'vitest';
import { createDatabase } from '../../src/infrastructure/persistence/database.js';
import { SqliteEventStore } from '../../src/infrastructure/persistence/sqlite-event-store.js';
import { SqliteCardReadModel } from '../../src/infrastructure/persistence/sqlite-card-read-model.js';
import { CardProjection } from '../../src/application/projections/card-projection.js';
import { CreateCardUseCase } from '../../src/application/use-cases/create-card.js';
import { MoveCardUseCase } from '../../src/application/use-cases/move-card.js';
import type Database from 'better-sqlite3';

const ACTOR = 'user-1';
const BOARD = 'board-1';

describe('MoveCardUseCase', () => {
  let db: Database.Database;
  let createCard: CreateCardUseCase;
  let moveCard: MoveCardUseCase;
  let readModel: SqliteCardReadModel;
  let eventStore: SqliteEventStore;

  beforeEach(() => {
    db = createDatabase();
    eventStore = new SqliteEventStore(db);
    readModel = new SqliteCardReadModel(db);
    const projection = new CardProjection(readModel);
    createCard = new CreateCardUseCase(eventStore, readModel, projection);
    moveCard = new MoveCardUseCase(eventStore, readModel, projection);
  });

  it('moves a card to a new column', () => {
    const { cardId } = createCard.execute({
      title: 'Move me',
      actorId: ACTOR,
      boardId: BOARD,
    });
    const result = moveCard.execute({
      cardId,
      toColumn: 'doing',
      actorId: ACTOR,
    });

    expect(result.fromColumn).toBe('todo');
    expect(result.toColumn).toBe('doing');
  });

  it('updates the read model after move', () => {
    const { cardId } = createCard.execute({
      title: 'Move me',
      actorId: ACTOR,
      boardId: BOARD,
    });
    moveCard.execute({
      cardId,
      toColumn: 'done',
      position: 3,
      actorId: ACTOR,
    });

    const card = readModel.findById(cardId);
    expect(card?.column).toBe('done');
    expect(card?.position).toBe(3);
  });

  it('appends move event to stream', () => {
    const { cardId } = createCard.execute({
      title: 'Move me',
      actorId: ACTOR,
      boardId: BOARD,
    });
    moveCard.execute({ cardId, toColumn: 'doing', actorId: ACTOR });

    const events = eventStore.getStream(cardId);
    expect(events).toHaveLength(2);
    expect(events[1].type).toBe('CardMoved');
    expect(events[1].version).toBe(2);
  });

  it('throws when card not found', () => {
    expect(() =>
      moveCard.execute({
        cardId: '00000000-0000-0000-0000-000000000000',
        toColumn: 'doing',
        actorId: ACTOR,
      }),
    ).toThrow('Card not found');
  });
});
