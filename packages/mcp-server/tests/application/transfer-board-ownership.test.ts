import { describe, it, expect, beforeEach } from 'vitest';
import { createDatabase } from '../../src/infrastructure/persistence/database.js';
import { SqliteEventStore } from '../../src/infrastructure/persistence/sqlite-event-store.js';
import { SqliteBoardReadModel } from '../../src/infrastructure/persistence/sqlite-board-read-model.js';
import { BoardProjection } from '../../src/application/projections/board-projection.js';
import { CreateBoardUseCase } from '../../src/application/use-cases/create-board.js';
import { TransferBoardOwnershipUseCase } from '../../src/application/use-cases/transfer-board-ownership.js';
import { OrgActorValidator } from '../../src/infrastructure/validation/actor-validator.js';
import type Database from 'better-sqlite3';
import type { OrgConfig } from '../../src/domain/agent-config.js';

const ORG_CONFIG: OrgConfig = {
  org: { name: 'Test Org' },
  agents: [
    { id: 'agent-1', display_name: 'Agent One', role_type: 'ic', identity: { email: 'a1@test.local' } },
    { id: 'agent-2', display_name: 'Agent Two', role_type: 'lead', identity: { email: 'a2@test.local' } },
  ],
};

const OWNER = 'agent-1';

describe('TransferBoardOwnershipUseCase', () => {
  let db: Database.Database;
  let createBoard: CreateBoardUseCase;
  let transfer: TransferBoardOwnershipUseCase;
  let readModel: SqliteBoardReadModel;
  let eventStore: SqliteEventStore;

  beforeEach(() => {
    db = createDatabase();
    eventStore = new SqliteEventStore(db);
    readModel = new SqliteBoardReadModel(db);
    const projection = new BoardProjection(readModel);
    const registry = new OrgActorValidator(ORG_CONFIG);
    createBoard = new CreateBoardUseCase(eventStore, readModel, projection);
    transfer = new TransferBoardOwnershipUseCase(eventStore, readModel, projection, registry);
  });

  it('transfers ownership to another agent', () => {
    const { boardId } = createBoard.execute({ name: 'Board', actorId: OWNER });

    const result = transfer.execute({ boardId, newOwnerId: 'agent-2', actorId: OWNER });

    expect(result.owner).toBe('agent-2');
    expect(readModel.findById(boardId)?.owner).toBe('agent-2');
  });

  it('throws when board not found', () => {
    expect(() =>
      transfer.execute({ boardId: 'missing', newOwnerId: 'agent-2', actorId: OWNER }),
    ).toThrow('Board not found');
  });

  it('throws when actor is not the owner', () => {
    const { boardId } = createBoard.execute({ name: 'Board', actorId: OWNER });

    expect(() =>
      transfer.execute({ boardId, newOwnerId: 'agent-2', actorId: 'agent-2' }),
    ).toThrow('Only the board owner');
  });

  it('throws when new owner is unknown agent', () => {
    const { boardId } = createBoard.execute({ name: 'Board', actorId: OWNER });

    expect(() =>
      transfer.execute({ boardId, newOwnerId: 'unknown', actorId: OWNER }),
    ).toThrow('Unknown agent');
  });
});
