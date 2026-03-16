import type { DomainEvent } from '../events/domain-event.js';

export interface EventStore {
  append(event: DomainEvent): void;
  getStream(streamId: string): DomainEvent[];
  getAllEvents(): DomainEvent[];
}
