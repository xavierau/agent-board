import { createChecklistItemRemovedEvent } from '../../domain/events/checklist-event-factories.js';
import type { EventStore } from '../../domain/repositories/event-store.js';
import type { ChecklistReadModel } from '../../domain/repositories/checklist-read-model.js';
import type { ChecklistProjection } from '../projections/checklist-projection.js';

type Input = { readonly itemId: string; readonly actorId: string };
type Result = { readonly itemId: string; readonly removed: true };

export class RemoveChecklistItemUseCase {
  constructor(
    private readonly eventStore: EventStore,
    private readonly checklistReadModel: ChecklistReadModel,
    private readonly projection: ChecklistProjection,
  ) {}

  execute(input: Input): Result {
    const item = this.checklistReadModel.findItemById(input.itemId);
    if (!item) throw new Error(`Checklist item not found: ${input.itemId}`);

    const checklist = this.checklistReadModel.findChecklistById(item.checklistId);
    if (!checklist) throw new Error(`Checklist not found: ${item.checklistId}`);

    const version = this.eventStore.getStream(checklist.cardId).length + 1;

    const event = createChecklistItemRemovedEvent({
      streamId: checklist.cardId,
      actorId: input.actorId,
      version,
      checklistId: item.checklistId,
      itemId: input.itemId,
    });

    this.eventStore.append(event);
    this.projection.apply(event);

    return { itemId: input.itemId, removed: true };
  }
}
