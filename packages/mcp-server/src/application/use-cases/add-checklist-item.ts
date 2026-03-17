import { v4 as uuidv4 } from 'uuid';
import { createChecklistItemAddedEvent } from '../../domain/events/checklist-event-factories.js';
import type { EventStore } from '../../domain/repositories/event-store.js';
import type { ChecklistReadModel } from '../../domain/repositories/checklist-read-model.js';
import type { ChecklistProjection } from '../projections/checklist-projection.js';

type Input = {
  readonly checklistId: string;
  readonly text: string;
  readonly actorId: string;
};

type Result = {
  readonly itemId: string;
  readonly checklistId: string;
  readonly text: string;
};

export class AddChecklistItemUseCase {
  constructor(
    private readonly eventStore: EventStore,
    private readonly checklistReadModel: ChecklistReadModel,
    private readonly projection: ChecklistProjection,
  ) {}

  execute(input: Input): Result {
    const checklist = this.checklistReadModel.findChecklistById(input.checklistId);
    if (!checklist) throw new Error(`Checklist not found: ${input.checklistId}`);

    const checklists = this.checklistReadModel.findByCard(checklist.cardId);
    const target = checklists.find((c) => c.id === input.checklistId);
    const position = target?.items.length ?? 0;
    const itemId = uuidv4();
    const version = this.eventStore.getStream(checklist.cardId).length + 1;

    const event = createChecklistItemAddedEvent({
      streamId: checklist.cardId,
      actorId: input.actorId,
      version,
      checklistId: input.checklistId,
      itemId,
      text: input.text,
      position,
    });

    this.eventStore.append(event);
    this.projection.apply(event);

    return { itemId, checklistId: input.checklistId, text: input.text };
  }
}
