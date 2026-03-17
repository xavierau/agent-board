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
    const result = listCards.execute({});
    expect(result.items).toEqual([]);
    expect(result.total).toBe(0);
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
    expect(result.items).toHaveLength(2);
    expect(result.total).toBe(2);
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

    const todoResult = listCards.execute({ column: 'todo' });
    expect(todoResult.items).toHaveLength(2);
    expect(todoResult.total).toBe(2);

    const doingResult = listCards.execute({ column: 'doing' });
    expect(doingResult.items).toHaveLength(1);
    expect(doingResult.total).toBe(1);
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

    const resultA = listCards.execute({ boardId: 'board-a' });
    expect(resultA.items).toHaveLength(1);

    const resultB = listCards.execute({ boardId: 'board-b' });
    expect(resultB.items).toHaveLength(1);
  });

  it('paginates results', () => {
    for (let i = 0; i < 5; i++) {
      createCard.execute({
        title: `Card ${i}`,
        column: 'todo',
        actorId: ACTOR,
        boardId: BOARD,
      });
    }

    const page1 = listCards.execute({ page: 1, pageSize: 2 });
    expect(page1.items).toHaveLength(2);
    expect(page1.total).toBe(5);
    expect(page1.page).toBe(1);
    expect(page1.pageSize).toBe(2);

    const page3 = listCards.execute({ page: 3, pageSize: 2 });
    expect(page3.items).toHaveLength(1);
    expect(page3.total).toBe(5);
  });

  it('paginates with boardId filter', () => {
    for (let i = 0; i < 3; i++) {
      createCard.execute({
        title: `Card ${i}`,
        actorId: ACTOR,
        boardId: BOARD,
      });
    }

    const result = listCards.execute({
      boardId: BOARD,
      page: 1,
      pageSize: 2,
    });
    expect(result.items).toHaveLength(2);
    expect(result.total).toBe(3);
  });
});
