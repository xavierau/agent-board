import type { ChecklistReadModel, Checklist } from '../../domain/repositories/checklist-read-model.js';

export class ListChecklistsUseCase {
  constructor(private readonly readModel: ChecklistReadModel) {}

  execute(cardId: string): Checklist[] {
    return this.readModel.findByCard(cardId);
  }
}
