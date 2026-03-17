export type BoardLabel = {
  readonly id: string;
  readonly boardId: string;
  readonly name: string;
  readonly color: string;
  readonly createdAt: string;
};

export interface BoardLabelReadModel {
  create(label: BoardLabel): void;
  update(id: string, name: string, color: string): void;
  remove(id: string): void;
  removeByBoardAndName(boardId: string, name: string): void;
  findById(id: string): BoardLabel | null;
  findByBoard(boardId: string): BoardLabel[];
  findByBoardAndName(boardId: string, name: string): BoardLabel | null;
}
