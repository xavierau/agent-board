import { createBoardVisibilityChangedEvent } from '../../domain/events/board-events.js';
import { isBoardOwner } from '../../domain/services/board-access.js';
import type { EventStore } from '../../domain/repositories/event-store.js';
import type { BoardReadModel, BoardView } from '../../domain/repositories/board-read-model.js';
import type { BoardProjection } from '../projections/board-projection.js';

type SetVisibilityInput = {
  readonly boardId: string;
  readonly visibility: 'public' | 'private';
  readonly actorId: string;
};

export class SetBoardVisibilityUseCase {
  constructor(
    private readonly eventStore: EventStore,
    private readonly readModel: BoardReadModel,
    private readonly projection: BoardProjection,
  ) {}

  execute(input: SetVisibilityInput): BoardView {
    const board = this.readModel.findById(input.boardId);
    if (!board) throw new Error(`Board not found: ${input.boardId}`);
    if (!isBoardOwner(board, input.actorId)) {
      throw new Error('Only the board owner can change visibility');
    }

    const version = this.eventStore.getStream(input.boardId).length + 1;
    const event = createBoardVisibilityChangedEvent({
      streamId: input.boardId,
      actorId: input.actorId,
      version,
      visibility: input.visibility,
    });

    this.eventStore.append(event);
    return this.projection.apply(event);
  }
}
