import { describe, it, expect, beforeEach } from 'vitest';
import { createDatabase } from '../../src/infrastructure/persistence/database.js';
import { SqliteEventStore } from '../../src/infrastructure/persistence/sqlite-event-store.js';
import { SqliteCardReadModel } from '../../src/infrastructure/persistence/sqlite-card-read-model.js';
import { CardProjection } from '../../src/application/projections/card-projection.js';
import { CreateCardUseCase } from '../../src/application/use-cases/create-card.js';
import { ListCardsUseCase } from '../../src/application/use-cases/list-cards.js';
import type Database from 'better-sqlite3';

const ACTOR = 'user-1';
const BOARD = 'board-1';

describe('ListCardsUseCase', () => {
  let db: Database.Database;
  let createCard: CreateCardUseCase;
  let listCards: ListCardsUseCase;

  beforeEach(() => {
    db = createDatabase();
    const eventStore = new SqliteEventStore(db);
    const readModel = new SqliteCardReadModel(db);
    const projection = new CardProjection(readModel);
    createCard = new CreateCardUseCase(eventStore, readModel, projection);
    listCards = new ListCardsUseCase(readModel);
  });

  it('returns empty list when no cards', () => {
    expect(listCards.execute({})).toEqual([]);
  });

  it('returns all cards without filter', () => {
    createCard.execute({
      title: 'A',
      column: 'todo',
      actorId: ACTOR,
      boardId: BOARD,
    });
    createCard.execute({
      title: 'B',
      column: 'doing',
      actorId: ACTOR,
      boardId: BOARD,
    });

    const result = listCards.execute({});
    expect(result).toHaveLength(2);
  });

  it('filters cards by column', () => {
    createCard.execute({
      title: 'Todo 1',
      column: 'todo',
      actorId: ACTOR,
      boardId: BOARD,
    });
    createCard.execute({
      title: 'Todo 2',
      column: 'todo',
      actorId: ACTOR,
      boardId: BOARD,
    });
    createCard.execute({
      title: 'Doing 1',
      column: 'doing',
      actorId: ACTOR,
      boardId: BOARD,
    });

    expect(listCards.execute({ column: 'todo' })).toHaveLength(2);
    expect(listCards.execute({ column: 'doing' })).toHaveLength(1);
  });

  it('filters cards by boardId', () => {
    createCard.execute({
      title: 'Board A',
      actorId: ACTOR,
      boardId: 'board-a',
    });
    createCard.execute({
      title: 'Board B',
      actorId: ACTOR,
      boardId: 'board-b',
    });

    expect(listCards.execute({ boardId: 'board-a' })).toHaveLength(1);
    expect(listCards.execute({ boardId: 'board-b' })).toHaveLength(1);
  });
});
