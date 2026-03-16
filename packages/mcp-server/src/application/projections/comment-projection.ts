import type { CommentAdded } from '../../domain/events/card-events.js';
import type { CommentReadModel } from '../../domain/repositories/comment-read-model.js';

export class CommentProjection {
  constructor(private readonly readModel: CommentReadModel) {}

  apply(event: CommentAdded): void {
    this.readModel.insert({
      id: event.payload.commentId,
      cardId: event.streamId,
      parentCommentId: event.payload.parentCommentId ?? null,
      authorId: event.actorId,
      text: event.payload.text,
      createdAt: event.occurredAt,
    });
  }
}
