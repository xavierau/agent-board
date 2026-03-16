import { describe, it, expect, beforeEach } from 'vitest';
import { createDatabase } from '../../src/infrastructure/persistence/database.js';
import { SqliteEventStore } from '../../src/infrastructure/persistence/sqlite-event-store.js';
import { SqliteCardReadModel } from '../../src/infrastructure/persistence/sqlite-card-read-model.js';
import { CardProjection } from '../../src/application/projections/card-projection.js';
import { CreateCardUseCase } from '../../src/application/use-cases/create-card.js';
import { UpdateCardUseCase } from '../../src/application/use-cases/update-card.js';
import type Database from 'better-sqlite3';

const ACTOR = 'user-1';
const BOARD = 'board-1';

describe('UpdateCardUseCase', () => {
  let db: Database.Database;
  let createCard: CreateCardUseCase;
  let updateCard: UpdateCardUseCase;
  let readModel: SqliteCardReadModel;

  beforeEach(() => {
    db = createDatabase();
    const eventStore = new SqliteEventStore(db);
    readModel = new SqliteCardReadModel(db);
    const projection = new CardProjection(readModel);
    createCard = new CreateCardUseCase(eventStore, readModel, projection);
    updateCard = new UpdateCardUseCase(eventStore, readModel, projection);
  });

  it('updates card title', () => {
    const { cardId } = createCard.execute({
      title: 'Old',
      actorId: ACTOR,
      boardId: BOARD,
    });

    const result = updateCard.execute({
      cardId,
      title: 'New Title',
      actorId: ACTOR,
    });

    expect(result.title).toBe('New Title');
    expect(readModel.findById(cardId)?.title).toBe('New Title');
  });

  it('updates card description', () => {
    const { cardId } = createCard.execute({
      title: 'Card',
      actorId: ACTOR,
      boardId: BOARD,
    });

    const result = updateCard.execute({
      cardId,
      description: 'New desc',
      actorId: ACTOR,
    });

    expect(result.description).toBe('New desc');
  });

  it('throws when card not found', () => {
    expect(() =>
      updateCard.execute({
        cardId: '00000000-0000-0000-0000-000000000000',
        title: 'X',
        actorId: ACTOR,
      }),
    ).toThrow('Card not found');
  });
});
