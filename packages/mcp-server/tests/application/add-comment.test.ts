import { describe, it, expect, beforeEach } from 'vitest';
import { createDatabase } from '../../src/infrastructure/persistence/database.js';
import { SqliteEventStore } from '../../src/infrastructure/persistence/sqlite-event-store.js';
import { SqliteCardReadModel } from '../../src/infrastructure/persistence/sqlite-card-read-model.js';
import { SqliteCommentReadModel } from '../../src/infrastructure/persistence/sqlite-comment-read-model.js';
import { CardProjection } from '../../src/application/projections/card-projection.js';
import { CommentProjection } from '../../src/application/projections/comment-projection.js';
import { CreateCardUseCase } from '../../src/application/use-cases/create-card.js';
import { AddCommentUseCase } from '../../src/application/use-cases/add-comment.js';
import type Database from 'better-sqlite3';

const ACTOR = 'user-1';
const BOARD = 'board-1';

describe('AddCommentUseCase', () => {
  let db: Database.Database;
  let createCard: CreateCardUseCase;
  let addComment: AddCommentUseCase;
  let commentReadModel: SqliteCommentReadModel;

  beforeEach(() => {
    db = createDatabase();
    const eventStore = new SqliteEventStore(db);
    const cardReadModel = new SqliteCardReadModel(db);
    commentReadModel = new SqliteCommentReadModel(db);
    const cardProjection = new CardProjection(cardReadModel);
    const commentProjection = new CommentProjection(commentReadModel);
    createCard = new CreateCardUseCase(
      eventStore,
      cardReadModel,
      cardProjection,
    );
    addComment = new AddCommentUseCase(
      eventStore,
      cardReadModel,
      commentReadModel,
      commentProjection,
    );
  });

  it('adds a comment to a card', () => {
    const { cardId } = createCard.execute({
      title: 'Card',
      actorId: ACTOR,
      boardId: BOARD,
    });

    const result = addComment.execute({
      cardId,
      text: 'Hello',
      actorId: ACTOR,
    });

    expect(result.commentId).toBeTruthy();
    expect(result.text).toBe('Hello');
  });

  it('persists comment to read model', () => {
    const { cardId } = createCard.execute({
      title: 'Card',
      actorId: ACTOR,
      boardId: BOARD,
    });
    addComment.execute({ cardId, text: 'First', actorId: ACTOR });

    const comments = commentReadModel.findByCard(cardId);
    expect(comments).toHaveLength(1);
    expect(comments[0].text).toBe('First');
    expect(comments[0].authorId).toBe(ACTOR);
  });

  it('supports threaded replies', () => {
    const { cardId } = createCard.execute({
      title: 'Card',
      actorId: ACTOR,
      boardId: BOARD,
    });
    const parent = addComment.execute({
      cardId,
      text: 'Parent',
      actorId: ACTOR,
    });
    const reply = addComment.execute({
      cardId,
      text: 'Reply',
      actorId: ACTOR,
      parentCommentId: parent.commentId,
    });

    const comment = commentReadModel.findById(reply.commentId);
    expect(comment?.parentCommentId).toBe(parent.commentId);
  });

  it('throws when card not found', () => {
    expect(() =>
      addComment.execute({
        cardId: '00000000-0000-0000-0000-000000000000',
        text: 'X',
        actorId: ACTOR,
      }),
    ).toThrow('Card not found');
  });

  it('throws when parent comment not found', () => {
    const { cardId } = createCard.execute({
      title: 'Card',
      actorId: ACTOR,
      boardId: BOARD,
    });

    expect(() =>
      addComment.execute({
        cardId,
        text: 'Reply',
        actorId: ACTOR,
        parentCommentId: '00000000-0000-0000-0000-000000000000',
      }),
    ).toThrow('Parent comment not found');
  });
});
