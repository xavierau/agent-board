import { createBoardLabelUpdatedEvent } from '../../domain/events/board-label-events.js';
import type { EventStore } from '../../domain/repositories/event-store.js';
import type { BoardLabelReadModel } from '../../domain/repositories/board-label-read-model.js';
import type { BoardLabelProjection } from '../projections/board-label-projection.js';

type UpdateBoardLabelInput = {
  readonly labelId: string;
  readonly name: string;
  readonly color: string;
  readonly actorId: string;
};

type UpdateBoardLabelResult = {
  readonly labelId: string;
  readonly name: string;
  readonly color: string;
};

export class UpdateBoardLabelUseCase {
  constructor(
    private readonly eventStore: EventStore,
    private readonly labelReadModel: BoardLabelReadModel,
    private readonly projection: BoardLabelProjection,
  ) {}

  execute(input: UpdateBoardLabelInput): UpdateBoardLabelResult {
    const label = this.labelReadModel.findById(input.labelId);
    if (!label) throw new Error(`Label not found: ${input.labelId}`);

    const version = this.eventStore.getStream(label.boardId).length + 1;

    const event = createBoardLabelUpdatedEvent({
      streamId: label.boardId,
      actorId: input.actorId,
      version,
      labelId: input.labelId,
      name: input.name,
      color: input.color,
    });

    this.eventStore.append(event);
    this.projection.apply(event);

    return { labelId: input.labelId, name: input.name, color: input.color };
  }
}
