import { createChecklistRemovedEvent } from '../../domain/events/checklist-event-factories.js';
import type { EventStore } from '../../domain/repositories/event-store.js';
import type { ChecklistReadModel } from '../../domain/repositories/checklist-read-model.js';
import type { ChecklistProjection } from '../projections/checklist-projection.js';

type Input = { readonly checklistId: string; readonly actorId: string };
type Result = { readonly checklistId: string; readonly removed: true };

export class RemoveChecklistUseCase {
  constructor(
    private readonly eventStore: EventStore,
    private readonly checklistReadModel: ChecklistReadModel,
    private readonly projection: ChecklistProjection,
  ) {}

  execute(input: Input): Result {
    const checklist = this.checklistReadModel.findChecklistById(input.checklistId);
    if (!checklist) throw new Error(`Checklist not found: ${input.checklistId}`);

    const version = this.eventStore.getStream(checklist.cardId).length + 1;

    const event = createChecklistRemovedEvent({
      streamId: checklist.cardId,
      actorId: input.actorId,
      version,
      checklistId: input.checklistId,
    });

    this.eventStore.append(event);
    this.projection.apply(event);

    return { checklistId: input.checklistId, removed: true };
  }
}
