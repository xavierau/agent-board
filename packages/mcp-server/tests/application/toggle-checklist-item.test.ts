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
import { ToggleChecklistItemUseCase } from '../../src/application/use-cases/toggle-checklist-item.js';
import type Database from 'better-sqlite3';

const ACTOR = 'user-1';

describe('ToggleChecklistItemUseCase', () => {
  let db: Database.Database;
  let toggleItem: ToggleChecklistItemUseCase;
  let checklistReadModel: SqliteChecklistReadModel;
  let itemId: string;

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

    const checklistId = new CreateChecklistUseCase(
      eventStore, cardReadModel, checklistReadModel, checklistProjection,
    ).execute({ cardId, title: 'Tasks', actorId: ACTOR }).checklistId;

    itemId = new AddChecklistItemUseCase(
      eventStore, checklistReadModel, checklistProjection,
    ).execute({ checklistId, text: 'Buy milk', actorId: ACTOR }).itemId;

    toggleItem = new ToggleChecklistItemUseCase(
      eventStore, checklistReadModel, checklistProjection,
    );
  });

  it('toggles item to completed', () => {
    const result = toggleItem.execute({
      itemId, completed: true, actorId: ACTOR,
    });

    expect(result.completed).toBe(true);
    expect(checklistReadModel.findItemById(itemId)?.completed).toBe(true);
  });

  it('toggles item back to incomplete', () => {
    toggleItem.execute({ itemId, completed: true, actorId: ACTOR });
    toggleItem.execute({ itemId, completed: false, actorId: ACTOR });

    expect(checklistReadModel.findItemById(itemId)?.completed).toBe(false);
  });

  it('throws when item not found', () => {
    expect(() =>
      toggleItem.execute({
        itemId: 'nonexistent', completed: true, actorId: ACTOR,
      }),
    ).toThrow('Checklist item not found');
  });
});
