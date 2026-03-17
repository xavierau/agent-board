import { describe, it, expect, beforeEach } from 'vitest';
import { createDatabase } from '../../src/infrastructure/persistence/database.js';
import { SqliteEventStore } from '../../src/infrastructure/persistence/sqlite-event-store.js';
import { SqliteBoardReadModel } from '../../src/infrastructure/persistence/sqlite-board-read-model.js';
import { SqliteBoardLabelReadModel } from '../../src/infrastructure/persistence/sqlite-board-label-read-model.js';
import { SqliteCardReadModel } from '../../src/infrastructure/persistence/sqlite-card-read-model.js';
import { SqliteLabelReadModel } from '../../src/infrastructure/persistence/sqlite-label-read-model.js';
import { BoardProjection } from '../../src/application/projections/board-projection.js';
import { BoardLabelProjection } from '../../src/application/projections/board-label-projection.js';
import { CardProjection } from '../../src/application/projections/card-projection.js';
import { LabelProjection } from '../../src/application/projections/label-projection.js';
import { CreateBoardUseCase } from '../../src/application/use-cases/create-board.js';
import { CreateBoardLabelUseCase } from '../../src/application/use-cases/create-board-label.js';
import { CreateCardUseCase } from '../../src/application/use-cases/create-card.js';
import { AddLabelUseCase } from '../../src/application/use-cases/add-label.js';
import { RemoveBoardLabelUseCase } from '../../src/application/use-cases/remove-board-label.js';
import type Database from 'better-sqlite3';

const ACTOR = 'user-1';

describe('RemoveBoardLabelUseCase', () => {
  let db: Database.Database;
  let createBoard: CreateBoardUseCase;
  let createLabel: CreateBoardLabelUseCase;
  let createCard: CreateCardUseCase;
  let addLabel: AddLabelUseCase;
  let removeLabel: RemoveBoardLabelUseCase;
  let labelReadModel: SqliteBoardLabelReadModel;
  let cardLabelReadModel: SqliteLabelReadModel;

  beforeEach(() => {
    db = createDatabase();
    const eventStore = new SqliteEventStore(db);
    const boardReadModel = new SqliteBoardReadModel(db);
    labelReadModel = new SqliteBoardLabelReadModel(db);
    const cardReadModel = new SqliteCardReadModel(db);
    cardLabelReadModel = new SqliteLabelReadModel(db);
    const boardProjection = new BoardProjection(boardReadModel);
    const boardLabelProjection = new BoardLabelProjection(labelReadModel);
    const cardProjection = new CardProjection(cardReadModel);
    const labelProjection = new LabelProjection(cardLabelReadModel);
    createBoard = new CreateBoardUseCase(eventStore, boardReadModel, boardProjection);
    createLabel = new CreateBoardLabelUseCase(
      eventStore, boardReadModel, labelReadModel, boardLabelProjection,
    );
    createCard = new CreateCardUseCase(eventStore, cardReadModel, cardProjection);
    addLabel = new AddLabelUseCase(eventStore, cardReadModel, labelProjection);
    removeLabel = new RemoveBoardLabelUseCase(
      eventStore, labelReadModel, boardLabelProjection, cardLabelReadModel,
    );
  });

  it('removes a board label', () => {
    const { boardId } = createBoard.execute({ name: 'Board', actorId: ACTOR });
    const { labelId } = createLabel.execute({
      boardId, name: 'bug', color: '#cf222e', actorId: ACTOR,
    });

    const result = removeLabel.execute({ labelId, actorId: ACTOR });

    expect(result.labelId).toBe(labelId);
    expect(labelReadModel.findById(labelId)).toBeNull();
  });

  it('throws when label not found', () => {
    expect(() =>
      removeLabel.execute({ labelId: 'nonexistent', actorId: ACTOR }),
    ).toThrow('Label not found');
  });

  it('also removes label from cards', () => {
    const { boardId } = createBoard.execute({ name: 'Board', actorId: ACTOR });
    const { labelId } = createLabel.execute({
      boardId, name: 'bug', color: '#cf222e', actorId: ACTOR,
    });
    const { cardId } = createCard.execute({
      title: 'Card', actorId: ACTOR, boardId,
    });
    addLabel.execute({ cardId, label: 'bug', color: '#cf222e', actorId: ACTOR });

    removeLabel.execute({ labelId, actorId: ACTOR });

    const cardLabels = cardLabelReadModel.findByCard(cardId);
    expect(cardLabels).toHaveLength(0);
  });
});
