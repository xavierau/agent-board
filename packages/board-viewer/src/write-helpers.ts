import { db } from './db.js';

export interface BoardRow {
  id: string;
  name: string;
  columns: string;
}

export interface CardRow {
  id: string;
  title: string;
  description: string;
  column_name: string;
  position: number;
  board_id: string;
  assignee: string | null;
}

export function getNextVersion(streamId: string): number {
  const row = db.prepare(
    'SELECT MAX(version) as max_v FROM events WHERE stream_id = ?'
  ).get(streamId) as { max_v: number | null } | undefined;
  return (row?.max_v ?? 0) + 1;
}

export function appendEvent(
  streamId: string, eventType: string,
  payload: object, actorId: string,
): void {
  const version = getNextVersion(streamId);
  const occurredAt = new Date().toISOString();
  db.prepare(
    'INSERT INTO events (stream_id, event_type, payload, version, actor_id, occurred_at) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(streamId, eventType, JSON.stringify(payload), version, actorId, occurredAt);
}

export function getMaxPosition(boardId: string, col: string): number {
  const row = db.prepare(
    'SELECT MAX(position) as max_pos FROM cards WHERE board_id = ? AND column_name = ?'
  ).get(boardId, col) as { max_pos: number | null } | undefined;
  return (row?.max_pos ?? -1) + 1;
}
