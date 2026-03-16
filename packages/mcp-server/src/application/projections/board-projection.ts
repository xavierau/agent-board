import type { BoardEvent } from '../../domain/events/board-events.js';
import type {
  BoardReadModel,
  BoardView,
} from '../../domain/repositories/board-read-model.js';

export class BoardProjection {
  constructor(private readonly readModel: BoardReadModel) {}

  apply(event: BoardEvent): BoardView {
    switch (event.type) {
      case 'BoardCreated':
        return this.applyCreated(event);
    }
  }

  private applyCreated(
    event: Extract<BoardEvent, { type: 'BoardCreated' }>,
  ): BoardView {
    return {
      id: event.streamId,
      name: event.payload.name,
      columns: event.payload.columns,
      createdBy: event.actorId,
      createdAt: event.occurredAt,
      updatedAt: event.occurredAt,
    };
  }
}
