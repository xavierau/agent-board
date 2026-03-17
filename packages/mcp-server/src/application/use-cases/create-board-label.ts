import { v4 as uuidv4 } from 'uuid';
import { createBoardLabelCreatedEvent } from '../../domain/events/board-label-events.js';
import type { EventStore } from '../../domain/repositories/event-store.js';
import type { BoardReadModel } from '../../domain/repositories/board-read-model.js';
import type { BoardLabelReadModel } from '../../domain/repositories/board-label-read-model.js';
import type { BoardLabelProjection } from '../projections/board-label-projection.js';

type CreateBoardLabelInput = {
  readonly boardId: string;
  readonly name: string;
  readonly color: string;
  readonly actorId: string;
};

type CreateBoardLabelResult = {
  readonly labelId: string;
  readonly boardId: string;
  readonly name: string;
  readonly color: string;
};

export class CreateBoardLabelUseCase {
  constructor(
    private readonly eventStore: EventStore,
    private readonly boardReadModel: BoardReadModel,
    private readonly labelReadModel: BoardLabelReadModel,
    private readonly projection: BoardLabelProjection,
  ) {}

  execute(input: CreateBoardLabelInput): CreateBoardLabelResult {
    this.validateBoard(input.boardId);
    this.validateUniqueName(input.boardId, input.name);

    const labelId = uuidv4();
    const version = this.eventStore.getStream(input.boardId).length + 1;

    const event = createBoardLabelCreatedEvent({
      streamId: input.boardId,
      actorId: input.actorId,
      version,
      labelId,
      name: input.name,
      color: input.color,
    });

    this.eventStore.append(event);
    this.projection.apply(event);

    return { labelId, boardId: input.boardId, name: input.name, color: input.color };
  }

  private validateBoard(boardId: string): void {
    if (!this.boardReadModel.findById(boardId)) {
      throw new Error(`Board not found: ${boardId}`);
    }
  }

  private validateUniqueName(boardId: string, name: string): void {
    if (this.labelReadModel.findByBoardAndName(boardId, name)) {
      throw new Error(`Label "${name}" already exists on this board`);
    }
  }
}
