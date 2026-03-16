export type CardCreated = {
  readonly type: 'CardCreated';
  readonly streamId: string;
  readonly version: number;
  readonly actorId: string;
  readonly payload: {
    readonly title: string;
    readonly description: string;
    readonly column: string;
    readonly position: number;
    readonly boardId: string;
  };
  readonly occurredAt: string;
};

export type CardMoved = {
  readonly type: 'CardMoved';
  readonly streamId: string;
  readonly version: number;
  readonly actorId: string;
  readonly payload: {
    readonly fromColumn: string;
    readonly toColumn: string;
    readonly position: number;
  };
  readonly occurredAt: string;
};

export type CardUpdated = {
  readonly type: 'CardUpdated';
  readonly streamId: string;
  readonly version: number;
  readonly actorId: string;
  readonly payload: {
    readonly title?: string;
    readonly description?: string;
  };
  readonly occurredAt: string;
};

export type CardArchived = {
  readonly type: 'CardArchived';
  readonly streamId: string;
  readonly version: number;
  readonly actorId: string;
  readonly payload: Record<string, never>;
  readonly occurredAt: string;
};

export type LabelAdded = {
  readonly type: 'LabelAdded';
  readonly streamId: string;
  readonly version: number;
  readonly actorId: string;
  readonly payload: {
    readonly label: string;
    readonly color: string;
  };
  readonly occurredAt: string;
};

export type LabelRemoved = {
  readonly type: 'LabelRemoved';
  readonly streamId: string;
  readonly version: number;
  readonly actorId: string;
  readonly payload: {
    readonly label: string;
  };
  readonly occurredAt: string;
};

export type CommentAdded = {
  readonly type: 'CommentAdded';
  readonly streamId: string;
  readonly version: number;
  readonly actorId: string;
  readonly payload: {
    readonly commentId: string;
    readonly text: string;
    readonly parentCommentId?: string;
  };
  readonly occurredAt: string;
};

export type CardAssigned = {
  readonly type: 'CardAssigned';
  readonly streamId: string;
  readonly version: number;
  readonly actorId: string;
  readonly payload: {
    readonly assigneeId: string | null;
  };
  readonly occurredAt: string;
};

export type CardEvent =
  | CardCreated
  | CardMoved
  | CardUpdated
  | CardArchived
  | LabelAdded
  | LabelRemoved
  | CommentAdded
  | CardAssigned;

export {
  createCardCreatedEvent,
  createCardMovedEvent,
  createCardUpdatedEvent,
  createCardArchivedEvent,
  createCardAssignedEvent,
} from './card-event-factories.js';

export {
  createLabelAddedEvent,
  createLabelRemovedEvent,
  createCommentAddedEvent,
} from './label-comment-factories.js';
