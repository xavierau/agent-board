import type { DomainEvent } from '../events/domain-event.js';

export type EventFeedItem = {
  readonly id: number;
  readonly streamId: string;
  readonly eventType: string;
  readonly payload: object;
  readonly actorId: string;
  readonly occurredAt: string;
};

export interface EventStore {
  append(event: DomainEvent): void;
  getStream(streamId: string): DomainEvent[];
  getAllEvents(): DomainEvent[];
  getEventsSince(sinceId: number, limit: number): EventFeedItem[];
}
