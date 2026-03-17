export type PaginationInput = {
  readonly page?: number;
  readonly pageSize?: number;
};

export type PaginatedResult<T> = {
  readonly items: T[];
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
};

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
  findByColumn(column: string, pagination?: PaginationInput): PaginatedResult<CardView>;
  findByBoard(boardId: string, pagination?: PaginationInput): PaginatedResult<CardView>;
  findAll(pagination?: PaginationInput): PaginatedResult<CardView>;
  archive(id: string): void;
  assign(id: string, assigneeId: string | null): void;
}
