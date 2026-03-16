export interface LabelReadModel {
  addLabel(
    cardId: string,
    label: string,
    color: string,
    addedAt: string,
  ): void;
  removeLabel(cardId: string, label: string): void;
  findByCard(cardId: string): Array<{ label: string; color: string }>;
}
