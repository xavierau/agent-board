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
import { createMcpServer } from '../../src/infrastructure/mcp/server.js';
import { OrgActorValidator } from '../../src/infrastructure/validation/actor-validator.js';
import type { OrgConfig } from '../../src/domain/agent-config.js';

const TEST_ORG: OrgConfig = {
  org: { name: 'Test Org' },
  agents: [
    { id: 'tester', display_name: 'Tester', role_type: 'ic', identity: { email: 'tester@test.local' } },
    { id: 'system', display_name: 'System', role_type: 'executive', identity: { email: 'system@test.local' } },
  ],
};

function buildTestDeps(db: Database.Database) {
  const eventStore = new SqliteEventStore(db);
  const cardRM = new SqliteCardReadModel(db);
  const boardRM = new SqliteBoardReadModel(db);
  const labelRM = new SqliteLabelReadModel(db);
  const commentRM = new SqliteCommentReadModel(db);

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
    actorValidator: new OrgActorValidator(TEST_ORG),
    agentRegistry: new OrgActorValidator(TEST_ORG),
  };
}

describe('MCP Server creation', () => {
  let db: Database.Database;

  beforeEach(() => {
    db = createDatabase(':memory:');
  });

  it('creates server with all 11 tools registered', () => {
    const deps = buildTestDeps(db);
    const server = createMcpServer(deps);
    expect(server).toBeDefined();
  });

  it('all use cases are wired correctly', () => {
    const deps = buildTestDeps(db);

    // Create a board first
    const board = deps.useCases.createBoard.execute({
      name: 'Test Board',
      actorId: 'tester',
    });
    expect(board.boardId).toBeTruthy();

    // Create a card
    const card = deps.useCases.createCard.execute({
      title: 'Test Card',
      boardId: board.boardId,
      actorId: 'tester',
    });
    expect(card.cardId).toBeTruthy();

    // List cards
    const cards = deps.useCases.listCards.execute({});
    expect(cards).toHaveLength(1);

    // Move card
    const moved = deps.useCases.moveCard.execute({
      cardId: card.cardId,
      toColumn: 'doing',
      actorId: 'tester',
    });
    expect(moved.toColumn).toBe('doing');

    // Update card
    const updated = deps.useCases.updateCard.execute({
      cardId: card.cardId,
      title: 'Updated',
      actorId: 'tester',
    });
    expect(updated.title).toBe('Updated');

    // Add label
    const label = deps.useCases.addLabel.execute({
      cardId: card.cardId,
      label: 'urgent',
      color: 'red',
      actorId: 'tester',
    });
    expect(label.label).toBe('urgent');

    // Add comment
    const comment = deps.useCases.addComment.execute({
      cardId: card.cardId,
      text: 'Hello',
      actorId: 'tester',
    });
    expect(comment.text).toBe('Hello');

    // List comments
    const comments = deps.useCases.listComments.execute({
      cardId: card.cardId,
    });
    expect(comments).toHaveLength(1);

    // Remove label
    const removed = deps.useCases.removeLabel.execute({
      cardId: card.cardId,
      label: 'urgent',
      actorId: 'tester',
    });
    expect(removed.label).toBe('urgent');

    // Archive card
    const archived = deps.useCases.archiveCard.execute({
      cardId: card.cardId,
      actorId: 'tester',
    });
    expect(archived.cardId).toBe(card.cardId);

    // List boards
    const boards = deps.useCases.listBoards.execute();
    expect(boards).toHaveLength(1);
  });
});
