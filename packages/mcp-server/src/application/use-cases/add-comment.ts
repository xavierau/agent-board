import { CommentId } from '../../domain/value-objects/comment-id.js';
import { createCommentAddedEvent } from '../../domain/events/card-events.js';
import type { EventStore } from '../../domain/repositories/event-store.js';
import type { CardReadModel } from '../../domain/repositories/card-read-model.js';
import type { CommentReadModel } from '../../domain/repositories/comment-read-model.js';
import type { CommentProjection } from '../projections/comment-projection.js';

type AddCommentInput = {
  readonly cardId: string;
  readonly text: string;
  readonly actorId: string;
  readonly parentCommentId?: string;
};

type AddCommentResult = {
  readonly commentId: string;
  readonly cardId: string;
  readonly text: string;
};

export class AddCommentUseCase {
  constructor(
    private readonly eventStore: EventStore,
    private readonly cardReadModel: CardReadModel,
    private readonly commentReadModel: CommentReadModel,
    private readonly projection: CommentProjection,
  ) {}

  execute(input: AddCommentInput): AddCommentResult {
    const card = this.cardReadModel.findById(input.cardId);
    if (!card) {
      throw new Error(`Card not found: ${input.cardId}`);
    }

    if (input.parentCommentId) {
      this.validateParentExists(input.parentCommentId);
    }

    const commentId = CommentId.generate();
    const version = this.eventStore.getStream(input.cardId).length + 1;

    const event = createCommentAddedEvent({
      streamId: input.cardId,
      actorId: input.actorId,
      version,
      commentId: commentId.value,
      text: input.text,
      parentCommentId: input.parentCommentId,
    });

    this.eventStore.append(event);
    this.projection.apply(event);

    return {
      commentId: commentId.value,
      cardId: input.cardId,
      text: input.text,
    };
  }

  private validateParentExists(parentId: string): void {
    const parent = this.commentReadModel.findById(parentId);
    if (!parent) {
      throw new Error(`Parent comment not found: ${parentId}`);
    }
  }
}
