import type { LabelAdded, LabelRemoved } from '../../domain/events/card-events.js';
import type { LabelReadModel } from '../../domain/repositories/label-read-model.js';

type LabelEvent = LabelAdded | LabelRemoved;

export class LabelProjection {
  constructor(private readonly readModel: LabelReadModel) {}

  apply(event: LabelEvent): void {
    switch (event.type) {
      case 'LabelAdded':
        return this.applyAdded(event);
      case 'LabelRemoved':
        return this.applyRemoved(event);
    }
  }

  private applyAdded(event: LabelAdded): void {
    this.readModel.addLabel(
      event.streamId,
      event.payload.label,
      event.payload.color,
      event.occurredAt,
    );
  }

  private applyRemoved(event: LabelRemoved): void {
    this.readModel.removeLabel(event.streamId, event.payload.label);
  }
}
