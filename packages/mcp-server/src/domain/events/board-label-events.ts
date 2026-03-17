export type BoardLabelCreated = {
  readonly type: 'BoardLabelCreated';
  readonly streamId: string;
  readonly version: number;
  readonly actorId: string;
  readonly payload: {
    readonly labelId: string;
    readonly name: string;
    readonly color: string;
  };
  readonly occurredAt: string;
};

export type BoardLabelUpdated = {
  readonly type: 'BoardLabelUpdated';
  readonly streamId: string;
  readonly version: number;
  readonly actorId: string;
  readonly payload: {
    readonly labelId: string;
    readonly name: string;
    readonly color: string;
  };
  readonly occurredAt: string;
};

export type BoardLabelRemoved = {
  readonly type: 'BoardLabelRemoved';
  readonly streamId: string;
  readonly version: number;
  readonly actorId: string;
  readonly payload: {
    readonly labelId: string;
    readonly name: string;
  };
  readonly occurredAt: string;
};

export type BoardLabelEvent =
  | BoardLabelCreated
  | BoardLabelUpdated
  | BoardLabelRemoved;

type CreateParams = {
  readonly streamId: string;
  readonly actorId: string;
  readonly version: number;
  readonly labelId: string;
  readonly name: string;
  readonly color: string;
};

export function createBoardLabelCreatedEvent(
  params: CreateParams,
): BoardLabelCreated {
  return {
    type: 'BoardLabelCreated',
    streamId: params.streamId,
    version: params.version,
    actorId: params.actorId,
    payload: {
      labelId: params.labelId,
      name: params.name,
      color: params.color,
    },
    occurredAt: new Date().toISOString(),
  };
}

type UpdateParams = {
  readonly streamId: string;
  readonly actorId: string;
  readonly version: number;
  readonly labelId: string;
  readonly name: string;
  readonly color: string;
};

export function createBoardLabelUpdatedEvent(
  params: UpdateParams,
): BoardLabelUpdated {
  return {
    type: 'BoardLabelUpdated',
    streamId: params.streamId,
    version: params.version,
    actorId: params.actorId,
    payload: {
      labelId: params.labelId,
      name: params.name,
      color: params.color,
    },
    occurredAt: new Date().toISOString(),
  };
}

type RemoveParams = {
  readonly streamId: string;
  readonly actorId: string;
  readonly version: number;
  readonly labelId: string;
  readonly name: string;
};

export function createBoardLabelRemovedEvent(
  params: RemoveParams,
): BoardLabelRemoved {
  return {
    type: 'BoardLabelRemoved',
    streamId: params.streamId,
    version: params.version,
    actorId: params.actorId,
    payload: {
      labelId: params.labelId,
      name: params.name,
    },
    occurredAt: new Date().toISOString(),
  };
}
