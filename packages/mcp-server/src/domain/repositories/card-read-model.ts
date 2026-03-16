export type CardView = {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly column: string;
  readonly position: number;
  readonly boardId: string;
  readonly archived: boolean;
  readonly assignee: string | null;
  readonly labels: ReadonlyArray<{ label: string; color: string }>;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export interface CardReadModel {
  upsert(card: CardView): void;
  findById(id: string): CardView | null;
  findByColumn(column: string): CardView[];
  findByBoard(boardId: string): CardView[];
  findAll(): CardView[];
  archive(id: string): void;
  assign(id: string, assigneeId: string | null): void;
}
