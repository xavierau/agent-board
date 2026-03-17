import { createBoardMemberRemovedEvent } from '../../domain/events/board-events.js';
import { isBoardOwner } from '../../domain/services/board-access.js';
import type { EventStore } from '../../domain/repositories/event-store.js';
import type { BoardReadModel, BoardView } from '../../domain/repositories/board-read-model.js';
import type { BoardProjection } from '../projections/board-projection.js';

type RemoveMemberInput = {
  readonly boardId: string;
  readonly memberId: string;
  readonly actorId: string;
};

export class RemoveBoardMemberUseCase {
  constructor(
    private readonly eventStore: EventStore,
    private readonly readModel: BoardReadModel,
    private readonly projection: BoardProjection,
  ) {}

  execute(input: RemoveMemberInput): BoardView {
    const board = this.readModel.findById(input.boardId);
    if (!board) throw new Error(`Board not found: ${input.boardId}`);
    if (!isBoardOwner(board, input.actorId)) {
      throw new Error('Only the board owner can remove members');
    }

    const version = this.eventStore.getStream(input.boardId).length + 1;
    const event = createBoardMemberRemovedEvent({
      streamId: input.boardId,
      actorId: input.actorId,
      version,
      memberId: input.memberId,
    });

    this.eventStore.append(event);
    return this.projection.apply(event);
  }
}
