import { describe, it, expect, beforeEach } from 'vitest';
import { createDatabase } from '../../src/infrastructure/persistence/database.js';
import { SqliteEventStore } from '../../src/infrastructure/persistence/sqlite-event-store.js';
import { SqliteCardReadModel } from '../../src/infrastructure/persistence/sqlite-card-read-model.js';
import { SqliteChecklistReadModel } from '../../src/infrastructure/persistence/sqlite-checklist-read-model.js';
import { SqliteBoardReadModel } from '../../src/infrastructure/persistence/sqlite-board-read-model.js';
import { CardProjection } from '../../src/application/projections/card-projection.js';
import { BoardProjection } from '../../src/application/projections/board-projection.js';
import { ChecklistProjection } from '../../src/application/projections/checklist-projection.js';
import { CreateBoardUseCase } from '../../src/application/use-cases/create-board.js';
import { CreateCardUseCase } from '../../src/application/use-cases/create-card.js';
import { CreateChecklistUseCase } from '../../src/application/use-cases/create-checklist.js';
import { AddChecklistItemUseCase } from '../../src/application/use-cases/add-checklist-item.js';
import type Database from 'better-sqlite3';

const ACTOR = 'user-1';

describe('AddChecklistItemUseCase', () => {
  let db: Database.Database;
  let addItem: AddChecklistItemUseCase;
  let checklistReadModel: SqliteChecklistReadModel;
  let checklistId: string;

  beforeEach(() => {
    db = createDatabase();
    const eventStore = new SqliteEventStore(db);
    const cardReadModel = new SqliteCardReadModel(db);
    checklistReadModel = new SqliteChecklistReadModel(db);
    const boardReadModel = new SqliteBoardReadModel(db);
    const cardProjection = new CardProjection(cardReadModel);
    const boardProjection = new BoardProjection(boardReadModel);
    const checklistProjection = new ChecklistProjection(checklistReadModel);

    const { boardId } = new CreateBoardUseCase(eventStore, boardReadModel, boardProjection)
      .execute({ name: 'Board', actorId: ACTOR });
    const { cardId } = new CreateCardUseCase(eventStore, cardReadModel, cardProjection)
      .execute({ title: 'Card', boardId, actorId: ACTOR });

    const createChecklist = new CreateChecklistUseCase(
      eventStore, cardReadModel, checklistReadModel, checklistProjection,
    );
    checklistId = createChecklist.execute({
      cardId, title: 'Tasks', actorId: ACTOR,
    }).checklistId;

    addItem = new AddChecklistItemUseCase(
      eventStore, checklistReadModel, checklistProjection,
    );
  });

  it('adds an item to a checklist', () => {
    const result = addItem.execute({
      checklistId, text: 'Buy milk', actorId: ACTOR,
    });

    expect(result.itemId).toBeTruthy();
    expect(result.text).toBe('Buy milk');
  });

  it('persists item to read model', () => {
    const { itemId } = addItem.execute({
      checklistId, text: 'Buy eggs', actorId: ACTOR,
    });

    const found = checklistReadModel.findItemById(itemId);
    expect(found).not.toBeNull();
    expect(found?.text).toBe('Buy eggs');
    expect(found?.completed).toBe(false);
  });

  it('auto-assigns position', () => {
    addItem.execute({ checklistId, text: 'First', actorId: ACTOR });
    const { itemId } = addItem.execute({
      checklistId, text: 'Second', actorId: ACTOR,
    });

    const found = checklistReadModel.findItemById(itemId);
    expect(found?.position).toBe(1);
  });

  it('throws when checklist not found', () => {
    expect(() =>
      addItem.execute({
        checklistId: 'nonexistent', text: 'test', actorId: ACTOR,
      }),
    ).toThrow('Checklist not found');
  });
});
