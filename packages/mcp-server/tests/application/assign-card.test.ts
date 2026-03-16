import { describe, it, expect, beforeEach } from 'vitest';
import { createDatabase } from '../../src/infrastructure/persistence/database.js';
import { SqliteEventStore } from '../../src/infrastructure/persistence/sqlite-event-store.js';
import { SqliteCardReadModel } from '../../src/infrastructure/persistence/sqlite-card-read-model.js';
import { CardProjection } from '../../src/application/projections/card-projection.js';
import { CreateCardUseCase } from '../../src/application/use-cases/create-card.js';
import { AssignCardUseCase } from '../../src/application/use-cases/assign-card.js';
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

const ACTOR = 'agent-1';
const BOARD = 'board-1';

describe('AssignCardUseCase', () => {
  let db: Database.Database;
  let createCard: CreateCardUseCase;
  let assignCard: AssignCardUseCase;
  let readModel: SqliteCardReadModel;
  let eventStore: SqliteEventStore;

  beforeEach(() => {
    db = createDatabase();
    eventStore = new SqliteEventStore(db);
    readModel = new SqliteCardReadModel(db);
    const projection = new CardProjection(readModel);
    const registry = new OrgActorValidator(ORG_CONFIG);
    createCard = new CreateCardUseCase(eventStore, readModel, projection);
    assignCard = new AssignCardUseCase(eventStore, readModel, projection, registry);
  });

  it('assigns an agent to a card', () => {
    const { cardId } = createCard.execute({
      title: 'Test Card',
      actorId: ACTOR,
      boardId: BOARD,
    });

    const result = assignCard.execute({
      cardId,
      assigneeId: 'agent-2',
      actorId: ACTOR,
    });

    expect(result.cardId).toBe(cardId);
    expect(result.assigneeId).toBe('agent-2');
    expect(readModel.findById(cardId)?.assignee).toBe('agent-2');
  });

  it('unassigns a card when assigneeId is null', () => {
    const { cardId } = createCard.execute({
      title: 'Test Card',
      actorId: ACTOR,
      boardId: BOARD,
    });

    assignCard.execute({ cardId, assigneeId: 'agent-2', actorId: ACTOR });
    const result = assignCard.execute({ cardId, assigneeId: null, actorId: ACTOR });

    expect(result.assigneeId).toBeNull();
    expect(readModel.findById(cardId)?.assignee).toBeNull();
  });

  it('throws when card not found', () => {
    expect(() =>
      assignCard.execute({
        cardId: '00000000-0000-0000-0000-000000000000',
        assigneeId: 'agent-1',
        actorId: ACTOR,
      }),
    ).toThrow('Card not found');
  });

  it('throws when assigneeId is unknown agent', () => {
    const { cardId } = createCard.execute({
      title: 'Test Card',
      actorId: ACTOR,
      boardId: BOARD,
    });

    expect(() =>
      assignCard.execute({
        cardId,
        assigneeId: 'unknown-agent',
        actorId: ACTOR,
      }),
    ).toThrow('Unknown agent');
  });

  it('appends CardAssigned event to event store', () => {
    const { cardId } = createCard.execute({
      title: 'Test Card',
      actorId: ACTOR,
      boardId: BOARD,
    });

    assignCard.execute({ cardId, assigneeId: 'agent-2', actorId: ACTOR });

    const events = eventStore.getStream(cardId);
    const last = events[events.length - 1];
    expect(last.type).toBe('CardAssigned');
    expect((last as any).payload.assigneeId).toBe('agent-2');
  });
});
