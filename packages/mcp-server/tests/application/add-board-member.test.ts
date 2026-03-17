import { describe, it, expect, beforeEach } from 'vitest';
import { createDatabase } from '../../src/infrastructure/persistence/database.js';
import { SqliteEventStore } from '../../src/infrastructure/persistence/sqlite-event-store.js';
import { SqliteBoardReadModel } from '../../src/infrastructure/persistence/sqlite-board-read-model.js';
import { BoardProjection } from '../../src/application/projections/board-projection.js';
import { CreateBoardUseCase } from '../../src/application/use-cases/create-board.js';
import { AddBoardMemberUseCase } from '../../src/application/use-cases/add-board-member.js';
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

describe('AddBoardMemberUseCase', () => {
  let db: Database.Database;
  let createBoard: CreateBoardUseCase;
  let addMember: AddBoardMemberUseCase;
  let readModel: SqliteBoardReadModel;
  let eventStore: SqliteEventStore;

  beforeEach(() => {
    db = createDatabase();
    eventStore = new SqliteEventStore(db);
    readModel = new SqliteBoardReadModel(db);
    const projection = new BoardProjection(readModel);
    const registry = new OrgActorValidator(ORG_CONFIG);
    createBoard = new CreateBoardUseCase(eventStore, readModel, projection);
    addMember = new AddBoardMemberUseCase(eventStore, readModel, projection, registry);
  });

  it('adds a member to a board', () => {
    const { boardId } = createBoard.execute({ name: 'Board', actorId: OWNER });

    const result = addMember.execute({ boardId, memberId: 'agent-2', actorId: OWNER });

    expect(result.members).toContain('agent-2');
    expect(readModel.findById(boardId)?.members).toContain('agent-2');
  });

  it('throws when board not found', () => {
    expect(() =>
      addMember.execute({ boardId: 'missing', memberId: 'agent-2', actorId: OWNER }),
    ).toThrow('Board not found');
  });

  it('throws when actor is not the owner', () => {
    const { boardId } = createBoard.execute({ name: 'Board', actorId: OWNER });

    expect(() =>
      addMember.execute({ boardId, memberId: 'agent-2', actorId: 'agent-2' }),
    ).toThrow('Only the board owner');
  });

  it('throws when memberId is unknown agent', () => {
    const { boardId } = createBoard.execute({ name: 'Board', actorId: OWNER });

    expect(() =>
      addMember.execute({ boardId, memberId: 'unknown', actorId: OWNER }),
    ).toThrow('Unknown agent');
  });

  it('appends BoardMemberAdded event', () => {
    const { boardId } = createBoard.execute({ name: 'Board', actorId: OWNER });
    addMember.execute({ boardId, memberId: 'agent-2', actorId: OWNER });

    const events = eventStore.getStream(boardId);
    expect(events[events.length - 1].type).toBe('BoardMemberAdded');
  });
});
