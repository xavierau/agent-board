import type {
  CardCreated,
  CardMoved,
  CardUpdated,
  CardArchived,
  CardAssigned,
  LabelAdded,
  LabelRemoved,
  CommentAdded,
} from './card-events.js';

type CreateCardParams = {
  readonly streamId: string;
  readonly actorId: string;
  readonly title: string;
  readonly description: string;
  readonly column: string;
  readonly position: number;
  readonly boardId: string;
};

export function createCardCreatedEvent(
  params: CreateCardParams,
): CardCreated {
  return {
    type: 'CardCreated',
    streamId: params.streamId,
    version: 1,
    actorId: params.actorId,
    payload: {
      title: params.title,
      description: params.description,
      column: params.column,
      position: params.position,
      boardId: params.boardId,
    },
    occurredAt: new Date().toISOString(),
  };
}

type MoveCardParams = {
  readonly streamId: string;
  readonly actorId: string;
  readonly version: number;
  readonly fromColumn: string;
  readonly toColumn: string;
  readonly position: number;
};

export function createCardMovedEvent(
  params: MoveCardParams,
): CardMoved {
  return {
    type: 'CardMoved',
    streamId: params.streamId,
    version: params.version,
    actorId: params.actorId,
    payload: {
      fromColumn: params.fromColumn,
      toColumn: params.toColumn,
      position: params.position,
    },
    occurredAt: new Date().toISOString(),
  };
}

type UpdateCardParams = {
  readonly streamId: string;
  readonly actorId: string;
  readonly version: number;
  readonly title?: string;
  readonly description?: string;
};

export function createCardUpdatedEvent(
  params: UpdateCardParams,
): CardUpdated {
  return {
    type: 'CardUpdated',
    streamId: params.streamId,
    version: params.version,
    actorId: params.actorId,
    payload: {
      title: params.title,
      description: params.description,
    },
    occurredAt: new Date().toISOString(),
  };
}

type ArchiveCardParams = {
  readonly streamId: string;
  readonly actorId: string;
  readonly version: number;
};

export function createCardArchivedEvent(
  params: ArchiveCardParams,
): CardArchived {
  return {
    type: 'CardArchived',
    streamId: params.streamId,
    version: params.version,
    actorId: params.actorId,
    payload: {} as Record<string, never>,
    occurredAt: new Date().toISOString(),
  };
}

type AssignCardParams = {
  readonly streamId: string;
  readonly actorId: string;
  readonly version: number;
  readonly assigneeId: string | null;
};

export function createCardAssignedEvent(
  params: AssignCardParams,
): CardAssigned {
  return {
    type: 'CardAssigned',
    streamId: params.streamId,
    version: params.version,
    actorId: params.actorId,
    payload: { assigneeId: params.assigneeId },
    occurredAt: new Date().toISOString(),
  };
}
