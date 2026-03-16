import type { CardEvent } from '../../domain/events/card-events.js';
import type {
  CardReadModel,
  CardView,
} from '../../domain/repositories/card-read-model.js';

export class CardProjection {
  constructor(private readonly readModel: CardReadModel) {}

  apply(event: CardEvent): CardView {
    switch (event.type) {
      case 'CardCreated':
        return this.applyCreated(event);
      case 'CardMoved':
        return this.applyMoved(event);
      case 'CardUpdated':
        return this.applyUpdated(event);
      case 'CardArchived':
        return this.applyArchived(event);
      case 'CardAssigned':
        return this.applyAssigned(event);
      default:
        return this.requireCard(event.streamId);
    }
  }

  private applyCreated(
    event: Extract<CardEvent, { type: 'CardCreated' }>,
  ): CardView {
    return {
      id: event.streamId,
      title: event.payload.title,
      description: event.payload.description,
      column: event.payload.column,
      position: event.payload.position,
      boardId: event.payload.boardId,
      archived: false,
      assignee: null,
      labels: [],
      createdAt: event.occurredAt,
      updatedAt: event.occurredAt,
    };
  }

  private applyMoved(
    event: Extract<CardEvent, { type: 'CardMoved' }>,
  ): CardView {
    const current = this.requireCard(event.streamId);
    return {
      ...current,
      column: event.payload.toColumn,
      position: event.payload.position,
      updatedAt: event.occurredAt,
    };
  }

  private applyUpdated(
    event: Extract<CardEvent, { type: 'CardUpdated' }>,
  ): CardView {
    const current = this.requireCard(event.streamId);
    return {
      ...current,
      title: event.payload.title ?? current.title,
      description: event.payload.description ?? current.description,
      updatedAt: event.occurredAt,
    };
  }

  private applyArchived(
    event: Extract<CardEvent, { type: 'CardArchived' }>,
  ): CardView {
    const current = this.requireCard(event.streamId);
    return { ...current, archived: true, updatedAt: event.occurredAt };
  }

  private applyAssigned(
    event: Extract<CardEvent, { type: 'CardAssigned' }>,
  ): CardView {
    const current = this.requireCard(event.streamId);
    return {
      ...current,
      assignee: event.payload.assigneeId,
      updatedAt: event.occurredAt,
    };
  }

  private requireCard(id: string): CardView {
    const current = this.readModel.findById(id);
    if (!current) {
      throw new Error(`Card not found: ${id}`);
    }
    return current;
  }
}
