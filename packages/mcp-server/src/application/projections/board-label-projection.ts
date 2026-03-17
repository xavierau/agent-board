import type {
  BoardLabelCreated,
  BoardLabelUpdated,
  BoardLabelRemoved,
  BoardLabelEvent,
} from '../../domain/events/board-label-events.js';
import type { BoardLabelReadModel } from '../../domain/repositories/board-label-read-model.js';

export class BoardLabelProjection {
  constructor(private readonly readModel: BoardLabelReadModel) {}

  apply(event: BoardLabelEvent): void {
    switch (event.type) {
      case 'BoardLabelCreated':
        return this.applyCreated(event);
      case 'BoardLabelUpdated':
        return this.applyUpdated(event);
      case 'BoardLabelRemoved':
        return this.applyRemoved(event);
    }
  }

  private applyCreated(event: BoardLabelCreated): void {
    this.readModel.create({
      id: event.payload.labelId,
      boardId: event.streamId,
      name: event.payload.name,
      color: event.payload.color,
      createdAt: event.occurredAt,
    });
  }

  private applyUpdated(event: BoardLabelUpdated): void {
    this.readModel.update(
      event.payload.labelId,
      event.payload.name,
      event.payload.color,
    );
  }

  private applyRemoved(event: BoardLabelRemoved): void {
    this.readModel.remove(event.payload.labelId);
  }
}
