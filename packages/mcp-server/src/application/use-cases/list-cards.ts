import type {
  CardReadModel,
  CardView,
} from '../../domain/repositories/card-read-model.js';

type ListCardsInput = {
  readonly column?: string;
  readonly boardId?: string;
};

export class ListCardsUseCase {
  constructor(private readonly readModel: CardReadModel) {}

  execute(input: ListCardsInput): CardView[] {
    if (input.boardId) {
      return this.readModel.findByBoard(input.boardId);
    }
    if (input.column) {
      return this.readModel.findByColumn(input.column);
    }
    return this.readModel.findAll();
  }
}
