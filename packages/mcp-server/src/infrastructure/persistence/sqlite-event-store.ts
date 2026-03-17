import type Database from 'better-sqlite3';
import type { EventStore, EventFeedItem } from '../../domain/repositories/event-store.js';
import type { DomainEvent } from '../../domain/events/domain-event.js';

export class SqliteEventStore implements EventStore {
  private readonly insertStmt: Database.Statement;
  private readonly streamStmt: Database.Statement;
  private readonly allStmt: Database.Statement;
  private readonly sinceStmt: Database.Statement;

  constructor(private readonly db: Database.Database) {
    this.insertStmt = db.prepare(
      `INSERT INTO events (stream_id, event_type, payload, version, actor_id, occurred_at)
       VALUES (@streamId, @eventType, @payload, @version, @actorId, @occurredAt)`,
    );
    this.streamStmt = db.prepare(
      'SELECT * FROM events WHERE stream_id = ? ORDER BY version',
    );
    this.allStmt = db.prepare('SELECT * FROM events ORDER BY id');
    this.sinceStmt = db.prepare(
      'SELECT id, stream_id, event_type, payload, actor_id, occurred_at FROM events WHERE id > ? ORDER BY id ASC LIMIT ?',
    );
  }

  append(event: DomainEvent): void {
    this.insertStmt.run({
      streamId: event.streamId,
      eventType: event.type,
      payload: JSON.stringify(event.payload),
      version: event.version,
      actorId: event.actorId,
      occurredAt: event.occurredAt,
    });
  }

  getStream(streamId: string): DomainEvent[] {
    const rows = this.streamStmt.all(streamId) as EventRow[];
    return rows.map(toDomainEvent);
  }

  getAllEvents(): DomainEvent[] {
    const rows = this.allStmt.all() as EventRow[];
    return rows.map(toDomainEvent);
  }

  getEventsSince(sinceId: number, limit: number): EventFeedItem[] {
    const rows = this.sinceStmt.all(sinceId, limit) as EventFeedRow[];
    return rows.map(toEventFeedItem);
  }
}

type EventRow = {
  stream_id: string;
  event_type: string;
  payload: string;
  version: number;
  actor_id: string;
  occurred_at: string;
};

type EventFeedRow = {
  id: number;
  stream_id: string;
  event_type: string;
  payload: string;
  actor_id: string;
  occurred_at: string;
};

function toEventFeedItem(row: EventFeedRow): EventFeedItem {
  return {
    id: row.id,
    streamId: row.stream_id,
    eventType: row.event_type,
    payload: JSON.parse(row.payload),
    actorId: row.actor_id,
    occurredAt: row.occurred_at,
  };
}

function toDomainEvent(row: EventRow): DomainEvent {
  return {
    type: row.event_type as DomainEvent['type'],
    streamId: row.stream_id,
    version: row.version,
    actorId: row.actor_id,
    payload: JSON.parse(row.payload),
    occurredAt: row.occurred_at,
  } as DomainEvent;
}
