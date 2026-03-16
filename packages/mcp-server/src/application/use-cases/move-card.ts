import { createCardMovedEvent } from '../../domain/events/card-events.js';
import type { EventStore } from '../../domain/repositories/event-store.js';
import type { CardReadModel } from '../../domain/repositories/card-read-model.js';
import type { CardProjection } from '../projections/card-projection.js';

type MoveCardInput = {
  readonly cardId: string;
  readonly toColumn: string;
  readonly position?: number;
  readonly actorId: string;
};

type MoveCardResult = {
  readonly cardId: string;
  readonly fromColumn: string;
  readonly toColumn: string;
  readonly position: number;
};

export class MoveCardUseCase {
  constructor(
    private readonly eventStore: EventStore,
    private readonly readModel: CardReadModel,
    private readonly projection: CardProjection,
  ) {}

  execute(input: MoveCardInput): MoveCardResult {
    const card = this.readModel.findById(input.cardId);
    if (!card) {
      throw new Error(`Card not found: ${input.cardId}`);
    }

    const stream = this.eventStore.getStream(input.cardId);
    const currentVersion = stream.length;
    const position = input.position ?? 0;

    const event = createCardMovedEvent({
      streamId: input.cardId,
      actorId: input.actorId,
      version: currentVersion + 1,
      fromColumn: card.column,
      toColumn: input.toColumn,
      position,
    });

    this.eventStore.append(event);
    const view = this.projection.apply(event);
    this.readModel.upsert(view);

    return {
      cardId: input.cardId,
      fromColumn: card.column,
      toColumn: input.toColumn,
      position,
    };
  }
}
