import type {
  ChecklistEvent,
  ChecklistCreated,
  ChecklistRemoved,
  ChecklistItemAdded,
  ChecklistItemToggled,
  ChecklistItemUpdated,
  ChecklistItemRemoved,
} from '../../domain/events/checklist-events.js';
import type { ChecklistReadModel } from '../../domain/repositories/checklist-read-model.js';

export class ChecklistProjection {
  constructor(private readonly readModel: ChecklistReadModel) {}

  apply(event: ChecklistEvent): void {
    switch (event.type) {
      case 'ChecklistCreated':
        return this.applyCreated(event);
      case 'ChecklistRemoved':
        return this.applyRemoved(event);
      case 'ChecklistItemAdded':
        return this.applyItemAdded(event);
      case 'ChecklistItemToggled':
        return this.applyItemToggled(event);
      case 'ChecklistItemUpdated':
        return this.applyItemUpdated(event);
      case 'ChecklistItemRemoved':
        return this.applyItemRemoved(event);
    }
  }

  private applyCreated(event: ChecklistCreated): void {
    this.readModel.createChecklist({
      id: event.payload.checklistId,
      cardId: event.streamId,
      title: event.payload.title,
      position: event.payload.position,
      createdAt: event.occurredAt,
    });
  }

  private applyRemoved(event: ChecklistRemoved): void {
    this.readModel.removeChecklist(event.payload.checklistId);
  }

  private applyItemAdded(event: ChecklistItemAdded): void {
    this.readModel.addItem({
      id: event.payload.itemId,
      checklistId: event.payload.checklistId,
      text: event.payload.text,
      completed: false,
      position: event.payload.position,
      createdAt: event.occurredAt,
    });
  }

  private applyItemToggled(event: ChecklistItemToggled): void {
    this.readModel.toggleItem(event.payload.itemId, event.payload.completed);
  }

  private applyItemUpdated(event: ChecklistItemUpdated): void {
    this.readModel.updateItem(event.payload.itemId, event.payload.text);
  }

  private applyItemRemoved(event: ChecklistItemRemoved): void {
    this.readModel.removeItem(event.payload.itemId);
  }
}
