import { createCardArchivedEvent } from '../../domain/events/card-events.js';
import type { EventStore } from '../../domain/repositories/event-store.js';
import type { CardReadModel } from '../../domain/repositories/card-read-model.js';
import type { CardProjection } from '../projections/card-projection.js';

type ArchiveCardInput = {
  readonly cardId: string;
  readonly actorId: string;
};

type ArchiveCardResult = {
  readonly cardId: string;
};

export class ArchiveCardUseCase {
  constructor(
    private readonly eventStore: EventStore,
    private readonly readModel: CardReadModel,
    private readonly projection: CardProjection,
  ) {}

  execute(input: ArchiveCardInput): ArchiveCardResult {
    const card = this.readModel.findById(input.cardId);
    if (!card) {
      throw new Error(`Card not found: ${input.cardId}`);
    }

    const version = this.eventStore.getStream(input.cardId).length + 1;

    const event = createCardArchivedEvent({
      streamId: input.cardId,
      actorId: input.actorId,
      version,
    });

    this.eventStore.append(event);
    this.readModel.archive(input.cardId);

    return { cardId: input.cardId };
  }
}
