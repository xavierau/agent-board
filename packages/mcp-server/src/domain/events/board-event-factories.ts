import type {
  BoardCreated,
  BoardVisibilityChanged,
  BoardOwnershipTransferred,
  BoardMemberAdded,
  BoardMemberRemoved,
} from './board-events.js';

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
    payload: { name: params.name, columns: params.columns },
    occurredAt: new Date().toISOString(),
  };
}

type VisibilityParams = {
  readonly streamId: string;
  readonly actorId: string;
  readonly version: number;
  readonly visibility: 'public' | 'private';
};

export function createBoardVisibilityChangedEvent(
  params: VisibilityParams,
): BoardVisibilityChanged {
  return {
    type: 'BoardVisibilityChanged',
    streamId: params.streamId,
    version: params.version,
    actorId: params.actorId,
    payload: { visibility: params.visibility },
    occurredAt: new Date().toISOString(),
  };
}

type OwnershipParams = {
  readonly streamId: string;
  readonly actorId: string;
  readonly version: number;
  readonly fromOwner: string;
  readonly toOwner: string;
};

export function createBoardOwnershipTransferredEvent(
  params: OwnershipParams,
): BoardOwnershipTransferred {
  return {
    type: 'BoardOwnershipTransferred',
    streamId: params.streamId,
    version: params.version,
    actorId: params.actorId,
    payload: { fromOwner: params.fromOwner, toOwner: params.toOwner },
    occurredAt: new Date().toISOString(),
  };
}

type MemberParams = {
  readonly streamId: string;
  readonly actorId: string;
  readonly version: number;
  readonly memberId: string;
};

export function createBoardMemberAddedEvent(
  params: MemberParams,
): BoardMemberAdded {
  return {
    type: 'BoardMemberAdded',
    streamId: params.streamId,
    version: params.version,
    actorId: params.actorId,
    payload: { memberId: params.memberId },
    occurredAt: new Date().toISOString(),
  };
}

export function createBoardMemberRemovedEvent(
  params: MemberParams,
): BoardMemberRemoved {
  return {
    type: 'BoardMemberRemoved',
    streamId: params.streamId,
    version: params.version,
    actorId: params.actorId,
    payload: { memberId: params.memberId },
    occurredAt: new Date().toISOString(),
  };
}
