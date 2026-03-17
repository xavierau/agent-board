import { describe, it, expect, beforeEach } from 'vitest';
import { createDatabase } from '../../src/infrastructure/persistence/database.js';
import { SqliteEventStore } from '../../src/infrastructure/persistence/sqlite-event-store.js';
import { SqliteBoardReadModel } from '../../src/infrastructure/persistence/sqlite-board-read-model.js';
import { SqliteBoardLabelReadModel } from '../../src/infrastructure/persistence/sqlite-board-label-read-model.js';
import { BoardProjection } from '../../src/application/projections/board-projection.js';
import { BoardLabelProjection } from '../../src/application/projections/board-label-projection.js';
import { CreateBoardUseCase } from '../../src/application/use-cases/create-board.js';
import { CreateBoardLabelUseCase } from '../../src/application/use-cases/create-board-label.js';
import type Database from 'better-sqlite3';

const ACTOR = 'user-1';

describe('CreateBoardLabelUseCase', () => {
  let db: Database.Database;
  let createBoard: CreateBoardUseCase;
  let createLabel: CreateBoardLabelUseCase;
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
  });

  it('creates a board label', () => {
    const { boardId } = createBoard.execute({ name: 'Board', actorId: ACTOR });

    const result = createLabel.execute({
      boardId, name: 'bug', color: '#cf222e', actorId: ACTOR,
    });

    expect(result.labelId).toBeTruthy();
    expect(result.name).toBe('bug');
    expect(result.color).toBe('#cf222e');
  });

  it('persists label to read model', () => {
    const { boardId } = createBoard.execute({ name: 'Board', actorId: ACTOR });

    const { labelId } = createLabel.execute({
      boardId, name: 'feature', color: '#1a7f37', actorId: ACTOR,
    });

    const found = labelReadModel.findById(labelId);
    expect(found).not.toBeNull();
    expect(found?.name).toBe('feature');
  });

  it('throws when board not found', () => {
    expect(() =>
      createLabel.execute({
        boardId: '00000000-0000-0000-0000-000000000000',
        name: 'bug', color: '#cf222e', actorId: ACTOR,
      }),
    ).toThrow('Board not found');
  });

  it('throws on duplicate name for same board', () => {
    const { boardId } = createBoard.execute({ name: 'Board', actorId: ACTOR });
    createLabel.execute({ boardId, name: 'bug', color: '#cf222e', actorId: ACTOR });

    expect(() =>
      createLabel.execute({ boardId, name: 'bug', color: '#ff0000', actorId: ACTOR }),
    ).toThrow('already exists');
  });
});
