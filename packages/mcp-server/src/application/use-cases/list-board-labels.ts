import type { BoardLabelReadModel, BoardLabel } from '../../domain/repositories/board-label-read-model.js';

export class ListBoardLabelsUseCase {
  constructor(private readonly readModel: BoardLabelReadModel) {}

  execute(boardId: string): BoardLabel[] {
    return this.readModel.findByBoard(boardId);
  }
}
