import { createBoardLabelRemovedEvent } from '../../domain/events/board-label-events.js';
import type { EventStore } from '../../domain/repositories/event-store.js';
import type { BoardLabelReadModel } from '../../domain/repositories/board-label-read-model.js';
import type { LabelReadModel } from '../../domain/repositories/label-read-model.js';
import type { BoardLabelProjection } from '../projections/board-label-projection.js';

type RemoveBoardLabelInput = {
  readonly labelId: string;
  readonly actorId: string;
};

type RemoveBoardLabelResult = {
  readonly labelId: string;
  readonly name: string;
};

export class RemoveBoardLabelUseCase {
  constructor(
    private readonly eventStore: EventStore,
    private readonly labelReadModel: BoardLabelReadModel,
    private readonly projection: BoardLabelProjection,
    private readonly cardLabelReadModel: LabelReadModel,
  ) {}

  execute(input: RemoveBoardLabelInput): RemoveBoardLabelResult {
    const label = this.labelReadModel.findById(input.labelId);
    if (!label) throw new Error(`Label not found: ${input.labelId}`);

    const version = this.eventStore.getStream(label.boardId).length + 1;

    const event = createBoardLabelRemovedEvent({
      streamId: label.boardId,
      actorId: input.actorId,
      version,
      labelId: input.labelId,
      name: label.name,
    });

    this.eventStore.append(event);
    this.projection.apply(event);
    this.cardLabelReadModel.removeLabelFromAllCards(label.name);

    return { labelId: input.labelId, name: label.name };
  }
}
