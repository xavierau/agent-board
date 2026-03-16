import { CardId } from '../../domain/value-objects/card-id.js';
import { createCardCreatedEvent } from '../../domain/events/card-events.js';
import type { EventStore } from '../../domain/repositories/event-store.js';
import type { CardReadModel } from '../../domain/repositories/card-read-model.js';
import type { CardProjection } from '../projections/card-projection.js';

type CreateCardInput = {
  readonly title: string;
  readonly description?: string;
  readonly column?: string;
  readonly actorId: string;
  readonly boardId: string;
};

type CreateCardResult = {
  readonly cardId: string;
  readonly title: string;
  readonly column: string;
};

export class CreateCardUseCase {
  constructor(
    private readonly eventStore: EventStore,
    private readonly readModel: CardReadModel,
    private readonly projection: CardProjection,
  ) {}

  execute(input: CreateCardInput): CreateCardResult {
    const cardId = CardId.generate();
    const column = input.column ?? 'todo';

    const event = createCardCreatedEvent({
      streamId: cardId.value,
      actorId: input.actorId,
      title: input.title,
      description: input.description ?? '',
      column,
      position: 0,
      boardId: input.boardId,
    });

    this.eventStore.append(event);
    const view = this.projection.apply(event);
    this.readModel.upsert(view);

    return { cardId: cardId.value, title: input.title, column };
  }
}
