import { createLabelAddedEvent } from '../../domain/events/card-events.js';
import type { EventStore } from '../../domain/repositories/event-store.js';
import type { CardReadModel } from '../../domain/repositories/card-read-model.js';
import type { LabelProjection } from '../projections/label-projection.js';

type AddLabelInput = {
  readonly cardId: string;
  readonly label: string;
  readonly color: string;
  readonly actorId: string;
};

type AddLabelResult = {
  readonly cardId: string;
  readonly label: string;
  readonly color: string;
};

export class AddLabelUseCase {
  constructor(
    private readonly eventStore: EventStore,
    private readonly cardReadModel: CardReadModel,
    private readonly projection: LabelProjection,
  ) {}

  execute(input: AddLabelInput): AddLabelResult {
    const card = this.cardReadModel.findById(input.cardId);
    if (!card) {
      throw new Error(`Card not found: ${input.cardId}`);
    }

    const version = this.eventStore.getStream(input.cardId).length + 1;

    const event = createLabelAddedEvent({
      streamId: input.cardId,
      actorId: input.actorId,
      version,
      label: input.label,
      color: input.color,
    });

    this.eventStore.append(event);
    this.projection.apply(event);

    return {
      cardId: input.cardId,
      label: input.label,
      color: input.color,
    };
  }
}
