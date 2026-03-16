import { createCardAssignedEvent } from '../../domain/events/card-events.js';
import type { EventStore } from '../../domain/repositories/event-store.js';
import type { CardReadModel } from '../../domain/repositories/card-read-model.js';
import type { CardProjection } from '../projections/card-projection.js';
import type { AgentRegistry } from '../../domain/repositories/agent-registry.js';

type AssignCardInput = {
  readonly cardId: string;
  readonly assigneeId: string | null;
  readonly actorId: string;
};

type AssignCardResult = {
  readonly cardId: string;
  readonly assigneeId: string | null;
};

export class AssignCardUseCase {
  constructor(
    private readonly eventStore: EventStore,
    private readonly readModel: CardReadModel,
    private readonly projection: CardProjection,
    private readonly agentRegistry: AgentRegistry,
  ) {}

  execute(input: AssignCardInput): AssignCardResult {
    const card = this.readModel.findById(input.cardId);
    if (!card) {
      throw new Error(`Card not found: ${input.cardId}`);
    }

    if (input.assigneeId !== null) {
      if (!this.agentRegistry.isKnownAgent(input.assigneeId)) {
        throw new Error(`Unknown agent: ${input.assigneeId}`);
      }
    }

    const version = this.eventStore.getStream(input.cardId).length + 1;

    const event = createCardAssignedEvent({
      streamId: input.cardId,
      actorId: input.actorId,
      version,
      assigneeId: input.assigneeId,
    });

    this.eventStore.append(event);
    const view = this.projection.apply(event);
    this.readModel.upsert(view);

    return { cardId: input.cardId, assigneeId: view.assignee };
  }
}
