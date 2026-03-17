import type {
  CardReadModel,
  PaginatedResult,
  PaginationInput,
  CardView,
} from '../../domain/repositories/card-read-model.js';

type ListCardsInput = {
  readonly column?: string;
  readonly boardId?: string;
} & PaginationInput;

export class ListCardsUseCase {
  constructor(private readonly readModel: CardReadModel) {}

  execute(input: ListCardsInput): PaginatedResult<CardView> {
    const pagination: PaginationInput = {
      page: input.page,
      pageSize: input.pageSize,
    };

    if (input.boardId) {
      return this.readModel.findByBoard(input.boardId, pagination);
    }
    if (input.column) {
      return this.readModel.findByColumn(input.column, pagination);
    }
    return this.readModel.findAll(pagination);
  }
}
