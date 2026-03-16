import { describe, it, expect, beforeEach } from 'vitest';
import { createDatabase } from '../../src/infrastructure/persistence/database.js';
import { SqliteEventStore } from '../../src/infrastructure/persistence/sqlite-event-store.js';
import { SqliteCardReadModel } from '../../src/infrastructure/persistence/sqlite-card-read-model.js';
import { CardProjection } from '../../src/application/projections/card-projection.js';
import { CreateCardUseCase } from '../../src/application/use-cases/create-card.js';
import { ArchiveCardUseCase } from '../../src/application/use-cases/archive-card.js';
import type Database from 'better-sqlite3';

const ACTOR = 'user-1';
const BOARD = 'board-1';

describe('ArchiveCardUseCase', () => {
  let db: Database.Database;
  let createCard: CreateCardUseCase;
  let archiveCard: ArchiveCardUseCase;
  let readModel: SqliteCardReadModel;
  let eventStore: SqliteEventStore;

  beforeEach(() => {
    db = createDatabase();
    eventStore = new SqliteEventStore(db);
    readModel = new SqliteCardReadModel(db);
    const projection = new CardProjection(readModel);
    createCard = new CreateCardUseCase(eventStore, readModel, projection);
    archiveCard = new ArchiveCardUseCase(eventStore, readModel, projection);
  });

  it('archives a card', () => {
    const { cardId } = createCard.execute({
      title: 'Archive me',
      actorId: ACTOR,
      boardId: BOARD,
    });

    const result = archiveCard.execute({ cardId, actorId: ACTOR });

    expect(result.cardId).toBe(cardId);
    expect(readModel.findById(cardId)?.archived).toBe(true);
  });

  it('persists archive event', () => {
    const { cardId } = createCard.execute({
      title: 'Archive me',
      actorId: ACTOR,
      boardId: BOARD,
    });
    archiveCard.execute({ cardId, actorId: ACTOR });

    const events = eventStore.getStream(cardId);
    expect(events).toHaveLength(2);
    expect(events[1].type).toBe('CardArchived');
  });

  it('throws when card not found', () => {
    expect(() =>
      archiveCard.execute({
        cardId: '00000000-0000-0000-0000-000000000000',
        actorId: ACTOR,
      }),
    ).toThrow('Card not found');
  });
});
