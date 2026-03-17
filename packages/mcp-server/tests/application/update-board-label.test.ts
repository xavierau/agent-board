import { describe, it, expect, beforeEach } from 'vitest';
import { createDatabase } from '../../src/infrastructure/persistence/database.js';
import { SqliteEventStore } from '../../src/infrastructure/persistence/sqlite-event-store.js';
import { SqliteBoardReadModel } from '../../src/infrastructure/persistence/sqlite-board-read-model.js';
import { SqliteBoardLabelReadModel } from '../../src/infrastructure/persistence/sqlite-board-label-read-model.js';
import { BoardProjection } from '../../src/application/projections/board-projection.js';
import { BoardLabelProjection } from '../../src/application/projections/board-label-projection.js';
import { CreateBoardUseCase } from '../../src/application/use-cases/create-board.js';
import { CreateBoardLabelUseCase } from '../../src/application/use-cases/create-board-label.js';
import { UpdateBoardLabelUseCase } from '../../src/application/use-cases/update-board-label.js';
import type Database from 'better-sqlite3';

const ACTOR = 'user-1';

describe('UpdateBoardLabelUseCase', () => {
  let db: Database.Database;
  let createBoard: CreateBoardUseCase;
  let createLabel: CreateBoardLabelUseCase;
  let updateLabel: UpdateBoardLabelUseCase;
  let labelReadModel: SqliteBoardLabelReadModel;

  beforeEach(() => {
    db = createDatabase();
    const eventStore = new SqliteEventStore(db);
    const boardReadModel = new SqliteBoardReadModel(db);
    labelReadModel = new SqliteBoardLabelReadModel(db);
    const boardProjection = new BoardProjection(boardReadModel);
    const labelProjection = new BoardLabelProjection(labelReadModel);
    createBoard = new CreateBoardUseCase(eventStore, boardReadModel, boardProjection);
    createLabel = new CreateBoardLabelUseCase(
      eventStore, boardReadModel, labelReadModel, labelProjection,
    );
    updateLabel = new UpdateBoardLabelUseCase(
      eventStore, labelReadModel, labelProjection,
    );
  });

  it('updates label name and color', () => {
    const { boardId } = createBoard.execute({ name: 'Board', actorId: ACTOR });
    const { labelId } = createLabel.execute({
      boardId, name: 'bug', color: '#cf222e', actorId: ACTOR,
    });

    const result = updateLabel.execute({
      labelId, name: 'critical', color: '#ff0000', actorId: ACTOR,
    });

    expect(result.name).toBe('critical');
    expect(result.color).toBe('#ff0000');
  });

  it('persists update to read model', () => {
    const { boardId } = createBoard.execute({ name: 'Board', actorId: ACTOR });
    const { labelId } = createLabel.execute({
      boardId, name: 'bug', color: '#cf222e', actorId: ACTOR,
    });

    updateLabel.execute({ labelId, name: 'updated', color: '#000', actorId: ACTOR });

    const found = labelReadModel.findById(labelId);
    expect(found?.name).toBe('updated');
  });

  it('throws when label not found', () => {
    expect(() =>
      updateLabel.execute({
        labelId: 'nonexistent', name: 'x', color: '#000', actorId: ACTOR,
      }),
    ).toThrow('Label not found');
  });
});
