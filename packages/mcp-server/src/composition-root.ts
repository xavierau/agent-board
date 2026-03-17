import { SqliteEventStore } from './infrastructure/persistence/sqlite-event-store.js';
import { SqliteCardReadModel } from './infrastructure/persistence/sqlite-card-read-model.js';
import { SqliteBoardReadModel } from './infrastructure/persistence/sqlite-board-read-model.js';
import { SqliteLabelReadModel } from './infrastructure/persistence/sqlite-label-read-model.js';
import { SqliteCommentReadModel } from './infrastructure/persistence/sqlite-comment-read-model.js';
import { SqliteBoardLabelReadModel } from './infrastructure/persistence/sqlite-board-label-read-model.js';
import { SqliteChecklistReadModel } from './infrastructure/persistence/sqlite-checklist-read-model.js';
import { CardProjection } from './application/projections/card-projection.js';
import { BoardProjection } from './application/projections/board-projection.js';
import { LabelProjection } from './application/projections/label-projection.js';
import { CommentProjection } from './application/projections/comment-projection.js';
import { BoardLabelProjection } from './application/projections/board-label-projection.js';
import { ChecklistProjection } from './application/projections/checklist-projection.js';
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
import { SetBoardVisibilityUseCase } from './application/use-cases/set-board-visibility.js';
import { TransferBoardOwnershipUseCase } from './application/use-cases/transfer-board-ownership.js';
import { AddBoardMemberUseCase } from './application/use-cases/add-board-member.js';
import { RemoveBoardMemberUseCase } from './application/use-cases/remove-board-member.js';
import { CreateBoardLabelUseCase } from './application/use-cases/create-board-label.js';
import { UpdateBoardLabelUseCase } from './application/use-cases/update-board-label.js';
import { RemoveBoardLabelUseCase } from './application/use-cases/remove-board-label.js';
import { ListBoardLabelsUseCase } from './application/use-cases/list-board-labels.js';
import { CreateChecklistUseCase } from './application/use-cases/create-checklist.js';
import { RemoveChecklistUseCase } from './application/use-cases/remove-checklist.js';
import { AddChecklistItemUseCase } from './application/use-cases/add-checklist-item.js';
import { ToggleChecklistItemUseCase } from './application/use-cases/toggle-checklist-item.js';
import { UpdateChecklistItemUseCase } from './application/use-cases/update-checklist-item.js';
import { RemoveChecklistItemUseCase } from './application/use-cases/remove-checklist-item.js';
import { ListChecklistsUseCase } from './application/use-cases/list-checklists.js';
import type { OrgActorValidator } from './infrastructure/validation/actor-validator.js';
import type Database from 'better-sqlite3';

function buildInfrastructure(db: Database.Database) {
  const eventStore = new SqliteEventStore(db);
  const cardReadModel = new SqliteCardReadModel(db);
  const boardReadModel = new SqliteBoardReadModel(db);
  const labelReadModel = new SqliteLabelReadModel(db);
  const commentReadModel = new SqliteCommentReadModel(db);
  const boardLabelReadModel = new SqliteBoardLabelReadModel(db);
  const checklistReadModel = new SqliteChecklistReadModel(db);
  return {
    eventStore, cardReadModel, boardReadModel,
    labelReadModel, commentReadModel, boardLabelReadModel, checklistReadModel,
    cardProjection: new CardProjection(cardReadModel),
    boardProjection: new BoardProjection(boardReadModel),
    labelProjection: new LabelProjection(labelReadModel),
    commentProjection: new CommentProjection(commentReadModel),
    boardLabelProjection: new BoardLabelProjection(boardLabelReadModel),
    checklistProjection: new ChecklistProjection(checklistReadModel),
  };
}

export function buildUseCases(
  db: Database.Database,
  registry: OrgActorValidator,
) {
  const i = buildInfrastructure(db);
  return {
    useCases: {
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
      setBoardVisibility: new SetBoardVisibilityUseCase(i.eventStore, i.boardReadModel, i.boardProjection),
      transferBoardOwnership: new TransferBoardOwnershipUseCase(i.eventStore, i.boardReadModel, i.boardProjection, registry),
      addBoardMember: new AddBoardMemberUseCase(i.eventStore, i.boardReadModel, i.boardProjection, registry),
      removeBoardMember: new RemoveBoardMemberUseCase(i.eventStore, i.boardReadModel, i.boardProjection),
      createBoardLabel: new CreateBoardLabelUseCase(i.eventStore, i.boardReadModel, i.boardLabelReadModel, i.boardLabelProjection),
      updateBoardLabel: new UpdateBoardLabelUseCase(i.eventStore, i.boardLabelReadModel, i.boardLabelProjection),
      removeBoardLabel: new RemoveBoardLabelUseCase(i.eventStore, i.boardLabelReadModel, i.boardLabelProjection, i.labelReadModel),
      listBoardLabels: new ListBoardLabelsUseCase(i.boardLabelReadModel),
      createChecklist: new CreateChecklistUseCase(i.eventStore, i.cardReadModel, i.checklistReadModel, i.checklistProjection),
      removeChecklist: new RemoveChecklistUseCase(i.eventStore, i.checklistReadModel, i.checklistProjection),
      addChecklistItem: new AddChecklistItemUseCase(i.eventStore, i.checklistReadModel, i.checklistProjection),
      toggleChecklistItem: new ToggleChecklistItemUseCase(i.eventStore, i.checklistReadModel, i.checklistProjection),
      updateChecklistItem: new UpdateChecklistItemUseCase(i.eventStore, i.checklistReadModel, i.checklistProjection),
      removeChecklistItem: new RemoveChecklistItemUseCase(i.eventStore, i.checklistReadModel, i.checklistProjection),
      listChecklists: new ListChecklistsUseCase(i.checklistReadModel),
    },
    boardReadModel: i.boardReadModel,
    cardReadModel: i.cardReadModel,
  };
}
