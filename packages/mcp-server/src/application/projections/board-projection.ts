import type { BoardEvent } from '../../domain/events/board-events.js';
import type {
  BoardReadModel,
  BoardView,
} from '../../domain/repositories/board-read-model.js';

export class BoardProjection {
  constructor(private readonly readModel: BoardReadModel) {}

  apply(event: BoardEvent): BoardView {
    switch (event.type) {
      case 'BoardCreated':
        return this.applyCreated(event);
      case 'BoardVisibilityChanged':
        return this.applyVisibilityChanged(event);
      case 'BoardOwnershipTransferred':
        return this.applyOwnershipTransferred(event);
      case 'BoardMemberAdded':
        return this.applyMemberAdded(event);
      case 'BoardMemberRemoved':
        return this.applyMemberRemoved(event);
    }
  }

  private applyCreated(
    event: Extract<BoardEvent, { type: 'BoardCreated' }>,
  ): BoardView {
    return {
      id: event.streamId,
      name: event.payload.name,
      columns: event.payload.columns,
      createdBy: event.actorId,
      owner: event.actorId,
      visibility: 'public',
      members: [],
      createdAt: event.occurredAt,
      updatedAt: event.occurredAt,
    };
  }

  private applyVisibilityChanged(
    event: Extract<BoardEvent, { type: 'BoardVisibilityChanged' }>,
  ): BoardView {
    const current = this.requireBoard(event.streamId);
    this.readModel.updateVisibility(event.streamId, event.payload.visibility);
    return { ...current, visibility: event.payload.visibility, updatedAt: event.occurredAt };
  }

  private applyOwnershipTransferred(
    event: Extract<BoardEvent, { type: 'BoardOwnershipTransferred' }>,
  ): BoardView {
    const current = this.requireBoard(event.streamId);
    this.readModel.updateOwner(event.streamId, event.payload.toOwner);
    return { ...current, owner: event.payload.toOwner, updatedAt: event.occurredAt };
  }

  private applyMemberAdded(
    event: Extract<BoardEvent, { type: 'BoardMemberAdded' }>,
  ): BoardView {
    const current = this.requireBoard(event.streamId);
    this.readModel.addMember(event.streamId, event.payload.memberId);
    return {
      ...current,
      members: [...current.members, event.payload.memberId],
      updatedAt: event.occurredAt,
    };
  }

  private applyMemberRemoved(
    event: Extract<BoardEvent, { type: 'BoardMemberRemoved' }>,
  ): BoardView {
    const current = this.requireBoard(event.streamId);
    this.readModel.removeMember(event.streamId, event.payload.memberId);
    return {
      ...current,
      members: current.members.filter(m => m !== event.payload.memberId),
      updatedAt: event.occurredAt,
    };
  }

  private requireBoard(id: string): BoardView {
    const current = this.readModel.findById(id);
    if (!current) throw new Error(`Board not found: ${id}`);
    return current;
  }
}
