export type BoardCreated = {
  readonly type: 'BoardCreated';
  readonly streamId: string;
  readonly version: number;
  readonly actorId: string;
  readonly payload: {
    readonly name: string;
    readonly columns: string[];
  };
  readonly occurredAt: string;
};

export type BoardEvent = BoardCreated;

type CreateBoardParams = {
  readonly streamId: string;
  readonly actorId: string;
  readonly name: string;
  readonly columns: string[];
};

export function createBoardCreatedEvent(
  params: CreateBoardParams,
): BoardCreated {
  return {
    type: 'BoardCreated',
    streamId: params.streamId,
    version: 1,
    actorId: params.actorId,
    payload: {
      name: params.name,
      columns: params.columns,
    },
    occurredAt: new Date().toISOString(),
  };
}
