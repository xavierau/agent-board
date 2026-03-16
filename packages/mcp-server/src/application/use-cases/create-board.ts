import { BoardId } from '../../domain/value-objects/board-id.js';
import { createBoardCreatedEvent } from '../../domain/events/board-events.js';
import type { EventStore } from '../../domain/repositories/event-store.js';
import type { BoardReadModel } from '../../domain/repositories/board-read-model.js';
import type { BoardProjection } from '../projections/board-projection.js';

const DEFAULT_COLUMNS = ['todo', 'doing', 'done'];

type CreateBoardInput = {
  readonly name: string;
  readonly columns?: string[];
  readonly actorId: string;
};

type CreateBoardResult = {
  readonly boardId: string;
  readonly name: string;
  readonly columns: string[];
};

export class CreateBoardUseCase {
  constructor(
    private readonly eventStore: EventStore,
    private readonly readModel: BoardReadModel,
    private readonly projection: BoardProjection,
  ) {}

  execute(input: CreateBoardInput): CreateBoardResult {
    const boardId = BoardId.generate();
    const columns = input.columns ?? DEFAULT_COLUMNS;

    const event = createBoardCreatedEvent({
      streamId: boardId.value,
      actorId: input.actorId,
      name: input.name,
      columns,
    });

    this.eventStore.append(event);
    const view = this.projection.apply(event);
    this.readModel.upsert(view);

    return { boardId: boardId.value, name: input.name, columns };
  }
}
