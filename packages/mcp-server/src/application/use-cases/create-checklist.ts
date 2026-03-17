import { v4 as uuidv4 } from 'uuid';
import { createChecklistCreatedEvent } from '../../domain/events/checklist-event-factories.js';
import type { EventStore } from '../../domain/repositories/event-store.js';
import type { CardReadModel } from '../../domain/repositories/card-read-model.js';
import type { ChecklistReadModel } from '../../domain/repositories/checklist-read-model.js';
import type { ChecklistProjection } from '../projections/checklist-projection.js';

type Input = {
  readonly cardId: string;
  readonly title: string;
  readonly actorId: string;
};

type Result = {
  readonly checklistId: string;
  readonly cardId: string;
  readonly title: string;
};

export class CreateChecklistUseCase {
  constructor(
    private readonly eventStore: EventStore,
    private readonly cardReadModel: CardReadModel,
    private readonly checklistReadModel: ChecklistReadModel,
    private readonly projection: ChecklistProjection,
  ) {}

  execute(input: Input): Result {
    const card = this.cardReadModel.findById(input.cardId);
    if (!card) throw new Error(`Card not found: ${input.cardId}`);

    const existing = this.checklistReadModel.findByCard(input.cardId);
    const position = existing.length;
    const checklistId = uuidv4();
    const version = this.eventStore.getStream(input.cardId).length + 1;

    const event = createChecklistCreatedEvent({
      streamId: input.cardId,
      actorId: input.actorId,
      version,
      checklistId,
      title: input.title,
      position,
    });

    this.eventStore.append(event);
    this.projection.apply(event);

    return { checklistId, cardId: input.cardId, title: input.title };
  }
}
