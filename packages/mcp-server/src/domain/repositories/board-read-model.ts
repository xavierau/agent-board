export type BoardView = {
  readonly id: string;
  readonly name: string;
  readonly columns: string[];
  readonly createdBy: string;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export interface BoardReadModel {
  upsert(board: BoardView): void;
  findById(id: string): BoardView | null;
  findAll(): BoardView[];
}
