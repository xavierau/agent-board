export type CommentView = {
  readonly id: string;
  readonly cardId: string;
  readonly parentCommentId: string | null;
  readonly authorId: string;
  readonly text: string;
  readonly createdAt: string;
};

export interface CommentReadModel {
  insert(comment: CommentView): void;
  findByCard(cardId: string): CommentView[];
  findById(id: string): CommentView | null;
}
