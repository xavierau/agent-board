import type {
  LabelAdded,
  LabelRemoved,
  CommentAdded,
} from './card-events.js';

type AddLabelParams = {
  readonly streamId: string;
  readonly actorId: string;
  readonly version: number;
  readonly label: string;
  readonly color: string;
};

export function createLabelAddedEvent(
  params: AddLabelParams,
): LabelAdded {
  return {
    type: 'LabelAdded',
    streamId: params.streamId,
    version: params.version,
    actorId: params.actorId,
    payload: {
      label: params.label,
      color: params.color,
    },
    occurredAt: new Date().toISOString(),
  };
}

type RemoveLabelParams = {
  readonly streamId: string;
  readonly actorId: string;
  readonly version: number;
  readonly label: string;
};

export function createLabelRemovedEvent(
  params: RemoveLabelParams,
): LabelRemoved {
  return {
    type: 'LabelRemoved',
    streamId: params.streamId,
    version: params.version,
    actorId: params.actorId,
    payload: {
      label: params.label,
    },
    occurredAt: new Date().toISOString(),
  };
}

type AddCommentParams = {
  readonly streamId: string;
  readonly actorId: string;
  readonly version: number;
  readonly commentId: string;
  readonly text: string;
  readonly parentCommentId?: string;
};

export function createCommentAddedEvent(
  params: AddCommentParams,
): CommentAdded {
  return {
    type: 'CommentAdded',
    streamId: params.streamId,
    version: params.version,
    actorId: params.actorId,
    payload: {
      commentId: params.commentId,
      text: params.text,
      parentCommentId: params.parentCommentId,
    },
    occurredAt: new Date().toISOString(),
  };
}
