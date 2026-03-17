export type BoardView = {
  readonly id: string;
  readonly name: string;
  readonly columns: string[];
  readonly createdBy: string;
  readonly owner: string;
  readonly visibility: 'public' | 'private';
  readonly members: readonly string[];
  readonly createdAt: string;
  readonly updatedAt: string;
};

export interface BoardReadModel {
  upsert(board: BoardView): void;
  findById(id: string): BoardView | null;
  findAll(): BoardView[];
  updateOwner(boardId: string, owner: string): void;
  updateVisibility(boardId: string, visibility: 'public' | 'private'): void;
  addMember(boardId: string, agentId: string): void;
  removeMember(boardId: string, agentId: string): void;
}
