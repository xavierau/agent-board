import type {
  BoardReadModel,
  BoardView,
} from '../../domain/repositories/board-read-model.js';

export class ListBoardsUseCase {
  constructor(private readonly readModel: BoardReadModel) {}

  execute(): BoardView[] {
    return this.readModel.findAll();
  }
}
