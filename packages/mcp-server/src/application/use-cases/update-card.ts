import { createCardUpdatedEvent } from '../../domain/events/card-events.js';
import type { EventStore } from '../../domain/repositories/event-store.js';
import type { CardReadModel } from '../../domain/repositories/card-read-model.js';
import type { CardProjection } from '../projections/card-projection.js';

type UpdateCardInput = {
  readonly cardId: string;
  readonly title?: string;
  readonly description?: string;
  readonly actorId: string;
};

type UpdateCardResult = {
  readonly cardId: string;
  readonly title: string;
  readonly description: string;
};

export class UpdateCardUseCase {
  constructor(
    private readonly eventStore: EventStore,
    private readonly readModel: CardReadModel,
    private readonly projection: CardProjection,
  ) {}

  execute(input: UpdateCardInput): UpdateCardResult {
    const card = this.readModel.findById(input.cardId);
    if (!card) {
      throw new Error(`Card not found: ${input.cardId}`);
    }

    const version = this.eventStore.getStream(input.cardId).length + 1;

    const event = createCardUpdatedEvent({
      streamId: input.cardId,
      actorId: input.actorId,
      version,
      title: input.title,
      description: input.description,
    });

    this.eventStore.append(event);
    const view = this.projection.apply(event);
    this.readModel.upsert(view);

    return {
      cardId: input.cardId,
      title: view.title,
      description: view.description,
    };
  }
}
