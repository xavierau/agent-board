export type ChecklistItem = {
  readonly id: string;
  readonly checklistId: string;
  readonly text: string;
  readonly completed: boolean;
  readonly position: number;
  readonly createdAt: string;
};

export type Checklist = {
  readonly id: string;
  readonly cardId: string;
  readonly title: string;
  readonly position: number;
  readonly createdAt: string;
  readonly items: readonly ChecklistItem[];
};

export interface ChecklistReadModel {
  createChecklist(checklist: Omit<Checklist, 'items'>): void;
  removeChecklist(id: string): void;
  addItem(item: ChecklistItem): void;
  updateItem(id: string, text: string): void;
  toggleItem(id: string, completed: boolean): void;
  removeItem(id: string): void;
  findByCard(cardId: string): Checklist[];
  findChecklistById(id: string): Omit<Checklist, 'items'> | null;
  findItemById(id: string): ChecklistItem | null;
}
