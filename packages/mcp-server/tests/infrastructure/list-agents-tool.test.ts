import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { createDatabase } from '../../src/infrastructure/persistence/database.js';
import { SqliteEventStore } from '../../src/infrastructure/persistence/sqlite-event-store.js';
import { SqliteCardReadModel } from '../../src/infrastructure/persistence/sqlite-card-read-model.js';
import { SqliteBoardReadModel } from '../../src/infrastructure/persistence/sqlite-board-read-model.js';
import { SqliteLabelReadModel } from '../../src/infrastructure/persistence/sqlite-label-read-model.js';
import { SqliteCommentReadModel } from '../../src/infrastructure/persistence/sqlite-comment-read-model.js';
import { CardProjection } from '../../src/application/projections/card-projection.js';
import { BoardProjection } from '../../src/application/projections/board-projection.js';
import { LabelProjection } from '../../src/application/projections/label-projection.js';
import { CommentProjection } from '../../src/application/projections/comment-projection.js';
import { CreateBoardUseCase } from '../../src/application/use-cases/create-board.js';
import { ListBoardsUseCase } from '../../src/application/use-cases/list-boards.js';
import { CreateCardUseCase } from '../../src/application/use-cases/create-card.js';
import { MoveCardUseCase } from '../../src/application/use-cases/move-card.js';
import { UpdateCardUseCase } from '../../src/application/use-cases/update-card.js';
import { ArchiveCardUseCase } from '../../src/application/use-cases/archive-card.js';
import { ListCardsUseCase } from '../../src/application/use-cases/list-cards.js';
import { AddLabelUseCase } from '../../src/application/use-cases/add-label.js';
import { RemoveLabelUseCase } from '../../src/application/use-cases/remove-label.js';
import { AddCommentUseCase } from '../../src/application/use-cases/add-comment.js';
import { ListCommentsUseCase } from '../../src/application/use-cases/list-comments.js';
import { OrgActorValidator } from '../../src/infrastructure/validation/actor-validator.js';
import type { OrgConfig } from '../../src/domain/agent-config.js';
import type { McpDeps } from '../../src/infrastructure/mcp/types.js';

const TEST_ORG: OrgConfig = {
  org: { name: 'Test Org' },
  agents: [
    { id: 'agent-a', display_name: 'Agent A', role_type: 'ic', identity: { email: 'a@test.local' } },
    { id: 'agent-b', display_name: 'Agent B', role_type: 'lead', identity: { email: 'b@test.local' } },
  ],
};

function buildTestDeps(db: Database.Database): McpDeps {
  const eventStore = new SqliteEventStore(db);
  const cardRM = new SqliteCardReadModel(db);
  const boardRM = new SqliteBoardReadModel(db);
  const labelRM = new SqliteLabelReadModel(db);
  const commentRM = new SqliteCommentReadModel(db);
  const validator = new OrgActorValidator(TEST_ORG);

  return {
    useCases: {
      createBoard: new CreateBoardUseCase(eventStore, boardRM, new BoardProjection(boardRM)),
      listBoards: new ListBoardsUseCase(boardRM),
      createCard: new CreateCardUseCase(eventStore, cardRM, new CardProjection(cardRM)),
      moveCard: new MoveCardUseCase(eventStore, cardRM, new CardProjection(cardRM)),
      updateCard: new UpdateCardUseCase(eventStore, cardRM, new CardProjection(cardRM)),
      archiveCard: new ArchiveCardUseCase(eventStore, cardRM, new CardProjection(cardRM)),
      listCards: new ListCardsUseCase(cardRM),
      addLabel: new AddLabelUseCase(eventStore, cardRM, new LabelProjection(labelRM)),
      removeLabel: new RemoveLabelUseCase(eventStore, cardRM, new LabelProjection(labelRM)),
      addComment: new AddCommentUseCase(eventStore, cardRM, commentRM, new CommentProjection(commentRM)),
      listComments: new ListCommentsUseCase(commentRM),
    },
    actorValidator: validator,
    agentRegistry: validator,
  };
}

describe('list-agents tool', () => {
  it('agentRegistry is accessible from deps', () => {
    const db = createDatabase(':memory:');
    const deps = buildTestDeps(db);
    const agents = deps.agentRegistry.getAllAgents();

    expect(agents).toHaveLength(2);
    expect(agents[0].id).toBe('agent-a');
    expect(agents[1].display_name).toBe('Agent B');
  });
});

describe('OrgActorValidator rejects unknown actors', () => {
  it('rejects actor not in org config', () => {
    const db = createDatabase(':memory:');
    const deps = buildTestDeps(db);
    expect(deps.actorValidator.validate('unknown-agent')).toBe(false);
  });

  it('accepts known actor from org config', () => {
    const db = createDatabase(':memory:');
    const deps = buildTestDeps(db);
    expect(deps.actorValidator.validate('agent-a')).toBe(true);
  });
});

describe('actor info helper', () => {
  it('builds actor info from registry', () => {
    const db = createDatabase(':memory:');
    const deps = buildTestDeps(db);
    const agent = deps.agentRegistry.getAgent('agent-a');

    expect(agent).toBeDefined();
    const actorInfo = { id: agent!.id, display_name: agent!.display_name };
    expect(actorInfo).toEqual({ id: 'agent-a', display_name: 'Agent A' });
  });
});
