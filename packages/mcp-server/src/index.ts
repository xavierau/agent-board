import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createDatabase } from './infrastructure/persistence/database.js';
import { SqliteEventStore } from './infrastructure/persistence/sqlite-event-store.js';
import { SqliteCardReadModel } from './infrastructure/persistence/sqlite-card-read-model.js';
import { SqliteBoardReadModel } from './infrastructure/persistence/sqlite-board-read-model.js';
import { SqliteLabelReadModel } from './infrastructure/persistence/sqlite-label-read-model.js';
import { SqliteCommentReadModel } from './infrastructure/persistence/sqlite-comment-read-model.js';
import { CardProjection } from './application/projections/card-projection.js';
import { BoardProjection } from './application/projections/board-projection.js';
import { LabelProjection } from './application/projections/label-projection.js';
import { CommentProjection } from './application/projections/comment-projection.js';
import { CreateBoardUseCase } from './application/use-cases/create-board.js';
import { ListBoardsUseCase } from './application/use-cases/list-boards.js';
import { CreateCardUseCase } from './application/use-cases/create-card.js';
import { MoveCardUseCase } from './application/use-cases/move-card.js';
import { UpdateCardUseCase } from './application/use-cases/update-card.js';
import { ArchiveCardUseCase } from './application/use-cases/archive-card.js';
import { ListCardsUseCase } from './application/use-cases/list-cards.js';
import { AddLabelUseCase } from './application/use-cases/add-label.js';
import { RemoveLabelUseCase } from './application/use-cases/remove-label.js';
import { AddCommentUseCase } from './application/use-cases/add-comment.js';
import { ListCommentsUseCase } from './application/use-cases/list-comments.js';
import { AssignCardUseCase } from './application/use-cases/assign-card.js';
import { createMcpServer } from './infrastructure/mcp/server.js';
import { OrgActorValidator } from './infrastructure/validation/actor-validator.js';
import { loadOrgConfig } from './infrastructure/config/org-config-loader.js';

async function main(): Promise<void> {
  const dataDir = ensureDataDir();
  const db = createDatabase(join(dataDir, 'kanban.db'));

  const orgPath = join(dataDir, 'org.yaml');
  const orgConfig = loadOrgConfig(orgPath);
  const validator = new OrgActorValidator(orgConfig);

  const deps = buildDependencies(db, validator, validator);
  ensureDefaultBoard(deps.useCases.createBoard, deps.useCases.listBoards);

  const server = createMcpServer(deps);
  const transport = new StdioServerTransport();
  await server.connect(transport);

  const agentCount = validator.getAllAgents().length;
  console.error(`Kanban MCP Server running on stdio (${agentCount} agents loaded)`);
}

function ensureDataDir(): string {
  const root = new URL('../../..', import.meta.url).pathname;
  const dataDir = join(root, 'data');
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true });
  }
  return dataDir;
}

function buildInfrastructure(db: import('better-sqlite3').Database) {
  const eventStore = new SqliteEventStore(db);
  const cardReadModel = new SqliteCardReadModel(db);
  const boardReadModel = new SqliteBoardReadModel(db);
  const labelReadModel = new SqliteLabelReadModel(db);
  const commentReadModel = new SqliteCommentReadModel(db);
  return {
    eventStore, cardReadModel, boardReadModel,
    labelReadModel, commentReadModel,
    cardProjection: new CardProjection(cardReadModel),
    boardProjection: new BoardProjection(boardReadModel),
    labelProjection: new LabelProjection(labelReadModel),
    commentProjection: new CommentProjection(commentReadModel),
  };
}

function buildDependencies(
  db: import('better-sqlite3').Database,
  validator: OrgActorValidator,
  registry: OrgActorValidator,
) {
  const i = buildInfrastructure(db);
  return {
    useCases: buildUseCases(i, registry),
    actorValidator: validator,
    agentRegistry: validator,
  };
}

function buildUseCases(
  i: ReturnType<typeof buildInfrastructure>,
  registry: OrgActorValidator,
) {
  return {
    createBoard: new CreateBoardUseCase(i.eventStore, i.boardReadModel, i.boardProjection),
    listBoards: new ListBoardsUseCase(i.boardReadModel),
    createCard: new CreateCardUseCase(i.eventStore, i.cardReadModel, i.cardProjection),
    moveCard: new MoveCardUseCase(i.eventStore, i.cardReadModel, i.cardProjection),
    updateCard: new UpdateCardUseCase(i.eventStore, i.cardReadModel, i.cardProjection),
    archiveCard: new ArchiveCardUseCase(i.eventStore, i.cardReadModel, i.cardProjection),
    listCards: new ListCardsUseCase(i.cardReadModel),
    addLabel: new AddLabelUseCase(i.eventStore, i.cardReadModel, i.labelProjection),
    removeLabel: new RemoveLabelUseCase(i.eventStore, i.cardReadModel, i.labelProjection),
    addComment: new AddCommentUseCase(i.eventStore, i.cardReadModel, i.commentReadModel, i.commentProjection),
    listComments: new ListCommentsUseCase(i.commentReadModel),
    assignCard: new AssignCardUseCase(i.eventStore, i.cardReadModel, i.cardProjection, registry),
  };
}

function ensureDefaultBoard(
  createBoard: CreateBoardUseCase,
  listBoards: ListBoardsUseCase,
): void {
  const boards = listBoards.execute();
  if (boards.length > 0) return;

  createBoard.execute({
    name: 'Default Board',
    actorId: 'system',
  });
  console.error('Created default board');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
