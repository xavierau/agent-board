import { createBoardOwnershipTransferredEvent } from '../../domain/events/board-events.js';
import { isBoardOwner } from '../../domain/services/board-access.js';
import type { EventStore } from '../../domain/repositories/event-store.js';
import type { BoardReadModel, BoardView } from '../../domain/repositories/board-read-model.js';
import type { BoardProjection } from '../projections/board-projection.js';
import type { AgentRegistry } from '../../domain/repositories/agent-registry.js';

type TransferInput = {
  readonly boardId: string;
  readonly newOwnerId: string;
  readonly actorId: string;
};

export class TransferBoardOwnershipUseCase {
  constructor(
    private readonly eventStore: EventStore,
    private readonly readModel: BoardReadModel,
    private readonly projection: BoardProjection,
    private readonly agentRegistry: AgentRegistry,
  ) {}

  execute(input: TransferInput): BoardView {
    const board = this.readModel.findById(input.boardId);
    if (!board) throw new Error(`Board not found: ${input.boardId}`);
    if (!isBoardOwner(board, input.actorId)) {
      throw new Error('Only the board owner can transfer ownership');
    }
    if (!this.agentRegistry.isKnownAgent(input.newOwnerId)) {
      throw new Error(`Unknown agent: ${input.newOwnerId}`);
    }

    const version = this.eventStore.getStream(input.boardId).length + 1;
    const event = createBoardOwnershipTransferredEvent({
      streamId: input.boardId,
      actorId: input.actorId,
      version,
      fromOwner: board.owner,
      toOwner: input.newOwnerId,
    });

    this.eventStore.append(event);
    return this.projection.apply(event);
  }
}
