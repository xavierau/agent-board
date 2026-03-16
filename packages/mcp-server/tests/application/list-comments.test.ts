import { describe, it, expect, beforeEach } from 'vitest';
import { createDatabase } from '../../src/infrastructure/persistence/database.js';
import { SqliteEventStore } from '../../src/infrastructure/persistence/sqlite-event-store.js';
import { SqliteCardReadModel } from '../../src/infrastructure/persistence/sqlite-card-read-model.js';
import { SqliteCommentReadModel } from '../../src/infrastructure/persistence/sqlite-comment-read-model.js';
import { CardProjection } from '../../src/application/projections/card-projection.js';
import { CommentProjection } from '../../src/application/projections/comment-projection.js';
import { CreateCardUseCase } from '../../src/application/use-cases/create-card.js';
import { AddCommentUseCase } from '../../src/application/use-cases/add-comment.js';
import { ListCommentsUseCase } from '../../src/application/use-cases/list-comments.js';
import type Database from 'better-sqlite3';

const ACTOR = 'user-1';
const BOARD = 'board-1';

describe('ListCommentsUseCase', () => {
  let db: Database.Database;
  let createCard: CreateCardUseCase;
  let addComment: AddCommentUseCase;
  let listComments: ListCommentsUseCase;

  beforeEach(() => {
    db = createDatabase();
    const eventStore = new SqliteEventStore(db);
    const cardReadModel = new SqliteCardReadModel(db);
    const commentReadModel = new SqliteCommentReadModel(db);
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
    listComments = new ListCommentsUseCase(commentReadModel);
  });

  it('returns empty list when no comments', () => {
    const result = listComments.execute({ cardId: 'nonexistent' });
    expect(result).toEqual([]);
  });

  it('returns all comments for a card', () => {
    const { cardId } = createCard.execute({
      title: 'Card',
      actorId: ACTOR,
      boardId: BOARD,
    });
    addComment.execute({ cardId, text: 'First', actorId: ACTOR });
    addComment.execute({ cardId, text: 'Second', actorId: ACTOR });

    const result = listComments.execute({ cardId });
    expect(result).toHaveLength(2);
  });

  it('does not return comments from other cards', () => {
    const card1 = createCard.execute({
      title: 'Card 1',
      actorId: ACTOR,
      boardId: BOARD,
    });
    const card2 = createCard.execute({
      title: 'Card 2',
      actorId: ACTOR,
      boardId: BOARD,
    });
    addComment.execute({
      cardId: card1.cardId,
      text: 'On card 1',
      actorId: ACTOR,
    });
    addComment.execute({
      cardId: card2.cardId,
      text: 'On card 2',
      actorId: ACTOR,
    });

    const result = listComments.execute({ cardId: card1.cardId });
    expect(result).toHaveLength(1);
    expect(result[0].text).toBe('On card 1');
  });
});
