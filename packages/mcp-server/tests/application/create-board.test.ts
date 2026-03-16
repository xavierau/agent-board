import { describe, it, expect, beforeEach } from 'vitest';
import { createDatabase } from '../../src/infrastructure/persistence/database.js';
import { SqliteEventStore } from '../../src/infrastructure/persistence/sqlite-event-store.js';
import { SqliteBoardReadModel } from '../../src/infrastructure/persistence/sqlite-board-read-model.js';
import { BoardProjection } from '../../src/application/projections/board-projection.js';
import { CreateBoardUseCase } from '../../src/application/use-cases/create-board.js';
import type Database from 'better-sqlite3';

const ACTOR = 'user-1';

describe('CreateBoardUseCase', () => {
  let db: Database.Database;
  let useCase: CreateBoardUseCase;
  let eventStore: SqliteEventStore;
  let readModel: SqliteBoardReadModel;

  beforeEach(() => {
    db = createDatabase();
    eventStore = new SqliteEventStore(db);
    readModel = new SqliteBoardReadModel(db);
    const projection = new BoardProjection(readModel);
    useCase = new CreateBoardUseCase(eventStore, readModel, projection);
  });

  it('creates a board with default columns', () => {
    const result = useCase.execute({ name: 'My Board', actorId: ACTOR });

    expect(result.boardId).toBeTruthy();
    expect(result.name).toBe('My Board');
    expect(result.columns).toEqual(['todo', 'doing', 'done']);
  });

  it('creates a board with custom columns', () => {
    const result = useCase.execute({
      name: 'Custom',
      columns: ['backlog', 'in-progress', 'review', 'done'],
      actorId: ACTOR,
    });

    expect(result.columns).toEqual([
      'backlog',
      'in-progress',
      'review',
      'done',
    ]);
  });

  it('persists event to event store', () => {
    const result = useCase.execute({ name: 'Persisted', actorId: ACTOR });
    const events = eventStore.getStream(result.boardId);

    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('BoardCreated');
  });

  it('persists board to read model', () => {
    const result = useCase.execute({ name: 'Readable', actorId: ACTOR });
    const board = readModel.findById(result.boardId);

    expect(board).not.toBeNull();
    expect(board?.name).toBe('Readable');
    expect(board?.createdBy).toBe(ACTOR);
  });
});
