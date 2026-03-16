import type { CreateBoardUseCase } from '../../application/use-cases/create-board.js';
import type { ListBoardsUseCase } from '../../application/use-cases/list-boards.js';
import type { CreateCardUseCase } from '../../application/use-cases/create-card.js';
import type { MoveCardUseCase } from '../../application/use-cases/move-card.js';
import type { UpdateCardUseCase } from '../../application/use-cases/update-card.js';
import type { ArchiveCardUseCase } from '../../application/use-cases/archive-card.js';
import type { ListCardsUseCase } from '../../application/use-cases/list-cards.js';
import type { AddLabelUseCase } from '../../application/use-cases/add-label.js';
import type { RemoveLabelUseCase } from '../../application/use-cases/remove-label.js';
import type { AddCommentUseCase } from '../../application/use-cases/add-comment.js';
import type { ListCommentsUseCase } from '../../application/use-cases/list-comments.js';
import type { ActorValidator } from '../validation/actor-validator.js';
import type { AgentRegistry } from '../../domain/repositories/agent-registry.js';

export type UseCases = {
  readonly createBoard: CreateBoardUseCase;
  readonly listBoards: ListBoardsUseCase;
  readonly createCard: CreateCardUseCase;
  readonly moveCard: MoveCardUseCase;
  readonly updateCard: UpdateCardUseCase;
  readonly archiveCard: ArchiveCardUseCase;
  readonly listCards: ListCardsUseCase;
  readonly addLabel: AddLabelUseCase;
  readonly removeLabel: RemoveLabelUseCase;
  readonly addComment: AddCommentUseCase;
  readonly listComments: ListCommentsUseCase;
};

export type McpDeps = {
  readonly useCases: UseCases;
  readonly actorValidator: ActorValidator;
  readonly agentRegistry: AgentRegistry;
};
