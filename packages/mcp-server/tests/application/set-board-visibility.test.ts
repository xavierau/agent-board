import { describe, it, expect, beforeEach } from 'vitest';
import { createDatabase } from '../../src/infrastructure/persistence/database.js';
import { SqliteEventStore } from '../../src/infrastructure/persistence/sqlite-event-store.js';
import { SqliteBoardReadModel } from '../../src/infrastructure/persistence/sqlite-board-read-model.js';
import { BoardProjection } from '../../src/application/projections/board-projection.js';
import { CreateBoardUseCase } from '../../src/application/use-cases/create-board.js';
import { SetBoardVisibilityUseCase } from '../../src/application/use-cases/set-board-visibility.js';
import type Database from 'better-sqlite3';

const OWNER = 'agent-1';

describe('SetBoardVisibilityUseCase', () => {
  let db: Database.Database;
  let createBoard: CreateBoardUseCase;
  let setVisibility: SetBoardVisibilityUseCase;
  let readModel: SqliteBoardReadModel;
  let eventStore: SqliteEventStore;

  beforeEach(() => {
    db = createDatabase();
    eventStore = new SqliteEventStore(db);
    readModel = new SqliteBoardReadModel(db);
    const projection = new BoardProjection(readModel);
    createBoard = new CreateBoardUseCase(eventStore, readModel, projection);
    setVisibility = new SetBoardVisibilityUseCase(eventStore, readModel, projection);
  });

  it('sets board visibility to private', () => {
    const { boardId } = createBoard.execute({ name: 'Board', actorId: OWNER });

    const result = setVisibility.execute({ boardId, visibility: 'private', actorId: OWNER });

    expect(result.visibility).toBe('private');
    expect(readModel.findById(boardId)?.visibility).toBe('private');
  });

  it('throws when board not found', () => {
    expect(() =>
      setVisibility.execute({ boardId: 'missing', visibility: 'private', actorId: OWNER }),
    ).toThrow('Board not found');
  });

  it('throws when actor is not the owner', () => {
    const { boardId } = createBoard.execute({ name: 'Board', actorId: OWNER });

    expect(() =>
      setVisibility.execute({ boardId, visibility: 'private', actorId: 'other-agent' }),
    ).toThrow('Only the board owner');
  });

  it('appends BoardVisibilityChanged event', () => {
    const { boardId } = createBoard.execute({ name: 'Board', actorId: OWNER });
    setVisibility.execute({ boardId, visibility: 'private', actorId: OWNER });

    const events = eventStore.getStream(boardId);
    expect(events[events.length - 1].type).toBe('BoardVisibilityChanged');
  });
});
