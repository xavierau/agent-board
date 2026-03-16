import { describe, it, expect } from 'vitest';
import {
  createCardCreatedEvent,
  createCardMovedEvent,
  createCardUpdatedEvent,
  createCardArchivedEvent,
  createLabelAddedEvent,
  createLabelRemovedEvent,
  createCommentAddedEvent,
} from '../../src/domain/events/card-events.js';

describe('createCardCreatedEvent (with actorId and boardId)', () => {
  it('includes actorId and boardId in the event', () => {
    const event = createCardCreatedEvent({
      streamId: 'card-1',
      actorId: 'backend-engineer',
      title: 'My Task',
      description: 'A description',
      column: 'todo',
      position: 0,
      boardId: 'board-1',
    });

    expect(event.actorId).toBe('backend-engineer');
    expect(event.payload.boardId).toBe('board-1');
    expect(event.type).toBe('CardCreated');
    expect(event.version).toBe(1);
  });
});

describe('createCardMovedEvent (with actorId)', () => {
  it('includes actorId in the event', () => {
    const event = createCardMovedEvent({
      streamId: 'card-1',
      actorId: 'backend-engineer',
      version: 2,
      fromColumn: 'todo',
      toColumn: 'doing',
      position: 1,
    });

    expect(event.actorId).toBe('backend-engineer');
    expect(event.type).toBe('CardMoved');
  });
});

describe('createCardUpdatedEvent', () => {
  it('creates event with title update', () => {
    const event = createCardUpdatedEvent({
      streamId: 'card-1',
      actorId: 'backend-engineer',
      version: 3,
      title: 'New Title',
    });

    expect(event.type).toBe('CardUpdated');
    expect(event.actorId).toBe('backend-engineer');
    expect(event.payload.title).toBe('New Title');
    expect(event.payload.description).toBeUndefined();
  });

  it('creates event with description update', () => {
    const event = createCardUpdatedEvent({
      streamId: 'card-1',
      actorId: 'backend-engineer',
      version: 3,
      description: 'New Desc',
    });

    expect(event.payload.description).toBe('New Desc');
    expect(event.payload.title).toBeUndefined();
  });
});

describe('createCardArchivedEvent', () => {
  it('creates event with empty payload', () => {
    const event = createCardArchivedEvent({
      streamId: 'card-1',
      actorId: 'backend-engineer',
      version: 4,
    });

    expect(event.type).toBe('CardArchived');
    expect(event.actorId).toBe('backend-engineer');
    expect(event.payload).toEqual({});
  });
});

describe('createLabelAddedEvent', () => {
  it('creates event with label and color', () => {
    const event = createLabelAddedEvent({
      streamId: 'card-1',
      actorId: 'backend-engineer',
      version: 2,
      label: 'bug',
      color: 'red',
    });

    expect(event.type).toBe('LabelAdded');
    expect(event.payload.label).toBe('bug');
    expect(event.payload.color).toBe('red');
  });
});

describe('createLabelRemovedEvent', () => {
  it('creates event with label name', () => {
    const event = createLabelRemovedEvent({
      streamId: 'card-1',
      actorId: 'backend-engineer',
      version: 3,
      label: 'bug',
    });

    expect(event.type).toBe('LabelRemoved');
    expect(event.payload.label).toBe('bug');
  });
});

describe('createCommentAddedEvent', () => {
  it('creates event with comment data', () => {
    const event = createCommentAddedEvent({
      streamId: 'card-1',
      actorId: 'backend-engineer',
      version: 2,
      commentId: 'comment-1',
      text: 'A comment',
    });

    expect(event.type).toBe('CommentAdded');
    expect(event.payload.commentId).toBe('comment-1');
    expect(event.payload.text).toBe('A comment');
    expect(event.payload.parentCommentId).toBeUndefined();
  });

  it('creates event with parent comment id', () => {
    const event = createCommentAddedEvent({
      streamId: 'card-1',
      actorId: 'backend-engineer',
      version: 3,
      commentId: 'comment-2',
      text: 'A reply',
      parentCommentId: 'comment-1',
    });

    expect(event.payload.parentCommentId).toBe('comment-1');
  });
});
