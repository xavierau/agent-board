import type { EventStore, EventFeedItem } from '../../domain/repositories/event-store.js';

type ListEventsInput = {
  readonly sinceId?: number;
  readonly limit?: number;
};

export class ListEventsUseCase {
  constructor(private readonly eventStore: EventStore) {}

  execute(input: ListEventsInput): EventFeedItem[] {
    const sinceId = input.sinceId ?? 0;
    const limit = input.limit ?? 100;
    return this.eventStore.getEventsSince(sinceId, limit);
  }
}
