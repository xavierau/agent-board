import { describe, it, expect, beforeEach } from 'vitest';
import { createDatabase } from '../../src/infrastructure/persistence/database.js';
import { SqliteEventStore } from '../../src/infrastructure/persistence/sqlite-event-store.js';
import { SqliteCardReadModel } from '../../src/infrastructure/persistence/sqlite-card-read-model.js';
import { SqliteChecklistReadModel } from '../../src/infrastructure/persistence/sqlite-checklist-read-model.js';
import { CardProjection } from '../../src/application/projections/card-projection.js';
import { ChecklistProjection } from '../../src/application/projections/checklist-projection.js';
import { CreateCardUseCase } from '../../src/application/use-cases/create-card.js';
import { CreateChecklistUseCase } from '../../src/application/use-cases/create-checklist.js';
import { SqliteBoardReadModel } from '../../src/infrastructure/persistence/sqlite-board-read-model.js';
import { BoardProjection } from '../../src/application/projections/board-projection.js';
import { CreateBoardUseCase } from '../../src/application/use-cases/create-board.js';
import type Database from 'better-sqlite3';

const ACTOR = 'user-1';

describe('CreateChecklistUseCase', () => {
  let db: Database.Database;
  let createChecklist: CreateChecklistUseCase;
  let checklistReadModel: SqliteChecklistReadModel;
  let cardId: string;

  beforeEach(() => {
    db = createDatabase();
    const eventStore = new SqliteEventStore(db);
    const cardReadModel = new SqliteCardReadModel(db);
    checklistReadModel = new SqliteChecklistReadModel(db);
    const boardReadModel = new SqliteBoardReadModel(db);
    const cardProjection = new CardProjection(cardReadModel);
    const boardProjection = new BoardProjection(boardReadModel);
    const checklistProjection = new ChecklistProjection(checklistReadModel);

    const createBoard = new CreateBoardUseCase(eventStore, boardReadModel, boardProjection);
    const { boardId } = createBoard.execute({ name: 'Board', actorId: ACTOR });

    const createCard = new CreateCardUseCase(eventStore, cardReadModel, cardProjection);
    const result = createCard.execute({
      title: 'Test Card', boardId, actorId: ACTOR,
    });
    cardId = result.cardId;

    createChecklist = new CreateChecklistUseCase(
      eventStore, cardReadModel, checklistReadModel, checklistProjection,
    );
  });

  it('creates a checklist', () => {
    const result = createChecklist.execute({
      cardId, title: 'My Checklist', actorId: ACTOR,
    });

    expect(result.checklistId).toBeTruthy();
    expect(result.title).toBe('My Checklist');
    expect(result.cardId).toBe(cardId);
  });

  it('persists checklist to read model', () => {
    const { checklistId } = createChecklist.execute({
      cardId, title: 'Tasks', actorId: ACTOR,
    });

    const found = checklistReadModel.findChecklistById(checklistId);
    expect(found).not.toBeNull();
    expect(found?.title).toBe('Tasks');
  });

  it('auto-assigns position', () => {
    createChecklist.execute({ cardId, title: 'First', actorId: ACTOR });
    const { checklistId } = createChecklist.execute({
      cardId, title: 'Second', actorId: ACTOR,
    });

    const found = checklistReadModel.findChecklistById(checklistId);
    expect(found?.position).toBe(1);
  });

  it('throws when card not found', () => {
    expect(() =>
      createChecklist.execute({
        cardId: '00000000-0000-0000-0000-000000000000',
        title: 'Tasks', actorId: ACTOR,
      }),
    ).toThrow('Card not found');
  });
});
