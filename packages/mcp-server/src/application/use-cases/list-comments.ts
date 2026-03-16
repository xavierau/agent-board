import type {
  CommentReadModel,
  CommentView,
} from '../../domain/repositories/comment-read-model.js';

type ListCommentsInput = {
  readonly cardId: string;
};

export class ListCommentsUseCase {
  constructor(private readonly readModel: CommentReadModel) {}

  execute(input: ListCommentsInput): CommentView[] {
    return this.readModel.findByCard(input.cardId);
  }
}
