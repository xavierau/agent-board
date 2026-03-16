import { describe, it, expect, beforeEach } from 'vitest';
import { createDatabase } from '../../src/infrastructure/persistence/database.js';
import { SqliteEventStore } from '../../src/infrastructure/persistence/sqlite-event-store.js';
import { SqliteBoardReadModel } from '../../src/infrastructure/persistence/sqlite-board-read-model.js';
import { BoardProjection } from '../../src/application/projections/board-projection.js';
import { CreateBoardUseCase } from '../../src/application/use-cases/create-board.js';
import { ListBoardsUseCase } from '../../src/application/use-cases/list-boards.js';
import type Database from 'better-sqlite3';

const ACTOR = 'user-1';

describe('ListBoardsUseCase', () => {
  let db: Database.Database;
  let createBoard: CreateBoardUseCase;
  let listBoards: ListBoardsUseCase;

  beforeEach(() => {
    db = createDatabase();
    const eventStore = new SqliteEventStore(db);
    const readModel = new SqliteBoardReadModel(db);
    const projection = new BoardProjection(readModel);
    createBoard = new CreateBoardUseCase(eventStore, readModel, projection);
    listBoards = new ListBoardsUseCase(readModel);
  });

  it('returns empty list when no boards', () => {
    expect(listBoards.execute()).toEqual([]);
  });

  it('returns all boards', () => {
    createBoard.execute({ name: 'Board A', actorId: ACTOR });
    createBoard.execute({ name: 'Board B', actorId: ACTOR });

    const result = listBoards.execute();
    expect(result).toHaveLength(2);
  });

  it('returns boards with correct data', () => {
    createBoard.execute({ name: 'Dev Board', actorId: ACTOR });

    const result = listBoards.execute();
    expect(result[0].name).toBe('Dev Board');
    expect(result[0].createdBy).toBe(ACTOR);
  });
});
