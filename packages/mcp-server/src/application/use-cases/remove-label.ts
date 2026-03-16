import { createLabelRemovedEvent } from '../../domain/events/card-events.js';
import type { EventStore } from '../../domain/repositories/event-store.js';
import type { CardReadModel } from '../../domain/repositories/card-read-model.js';
import type { LabelProjection } from '../projections/label-projection.js';

type RemoveLabelInput = {
  readonly cardId: string;
  readonly label: string;
  readonly actorId: string;
};

type RemoveLabelResult = {
  readonly cardId: string;
  readonly label: string;
};

export class RemoveLabelUseCase {
  constructor(
    private readonly eventStore: EventStore,
    private readonly cardReadModel: CardReadModel,
    private readonly projection: LabelProjection,
  ) {}

  execute(input: RemoveLabelInput): RemoveLabelResult {
    const card = this.cardReadModel.findById(input.cardId);
    if (!card) {
      throw new Error(`Card not found: ${input.cardId}`);
    }

    const version = this.eventStore.getStream(input.cardId).length + 1;

    const event = createLabelRemovedEvent({
      streamId: input.cardId,
      actorId: input.actorId,
      version,
      label: input.label,
    });

    this.eventStore.append(event);
    this.projection.apply(event);

    return { cardId: input.cardId, label: input.label };
  }
}
