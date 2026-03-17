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

export type BoardVisibilityChanged = {
  readonly type: 'BoardVisibilityChanged';
  readonly streamId: string;
  readonly version: number;
  readonly actorId: string;
  readonly payload: {
    readonly visibility: 'public' | 'private';
  };
  readonly occurredAt: string;
};

export type BoardOwnershipTransferred = {
  readonly type: 'BoardOwnershipTransferred';
  readonly streamId: string;
  readonly version: number;
  readonly actorId: string;
  readonly payload: {
    readonly fromOwner: string;
    readonly toOwner: string;
  };
  readonly occurredAt: string;
};

export type BoardMemberAdded = {
  readonly type: 'BoardMemberAdded';
  readonly streamId: string;
  readonly version: number;
  readonly actorId: string;
  readonly payload: {
    readonly memberId: string;
  };
  readonly occurredAt: string;
};

export type BoardMemberRemoved = {
  readonly type: 'BoardMemberRemoved';
  readonly streamId: string;
  readonly version: number;
  readonly actorId: string;
  readonly payload: {
    readonly memberId: string;
  };
  readonly occurredAt: string;
};

export type BoardEvent =
  | BoardCreated
  | BoardVisibilityChanged
  | BoardOwnershipTransferred
  | BoardMemberAdded
  | BoardMemberRemoved;

export {
  createBoardCreatedEvent,
  createBoardVisibilityChangedEvent,
  createBoardOwnershipTransferredEvent,
  createBoardMemberAddedEvent,
  createBoardMemberRemovedEvent,
} from './board-event-factories.js';
