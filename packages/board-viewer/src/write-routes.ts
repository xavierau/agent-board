import { Router, type Request, type Response } from 'express';
import { randomUUID } from 'node:crypto';
import { db } from './db.js';

export const writeRouter = Router();

interface BoardRow {
  id: string;
  columns: string;
}

interface CardRow {
  id: string;
  title: string;
  description: string;
  column_name: string;
  position: number;
  board_id: string;
}

function getNextVersion(streamId: string): number {
  const row = db.prepare(
    'SELECT MAX(version) as max_v FROM events WHERE stream_id = ?'
  ).get(streamId) as { max_v: number | null } | undefined;
  return (row?.max_v ?? 0) + 1;
}

function appendEvent(streamId: string, eventType: string, payload: object, actorId: string) {
  const version = getNextVersion(streamId);
  const occurredAt = new Date().toISOString();
  db.prepare(
    'INSERT INTO events (stream_id, event_type, payload, version, actor_id, occurred_at) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(streamId, eventType, JSON.stringify(payload), version, actorId, occurredAt);
}

function getMaxPosition(boardId: string, columnName: string): number {
  const row = db.prepare(
    'SELECT MAX(position) as max_pos FROM cards WHERE board_id = ? AND column_name = ?'
  ).get(boardId, columnName) as { max_pos: number | null } | undefined;
  return (row?.max_pos ?? -1) + 1;
}

writeRouter.post('/api/boards', (req: Request, res: Response) => {
  const { name, columns, actorId } = req.body;
  if (!name || (typeof name === 'string' && name.trim() === '')) {
    res.status(400).json({ error: 'name is required' }); return;
  }
  if (columns !== undefined && (!Array.isArray(columns) || columns.length === 0)) {
    res.status(400).json({ error: 'columns must be a non-empty array' }); return;
  }

  const actor = actorId ?? 'web-user';
  const boardColumns = columns ?? ['todo', 'doing', 'done'];
  const id = randomUUID();
  const now = new Date().toISOString();

  db.prepare(
    'INSERT INTO boards (id, name, columns, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(id, name.trim(), JSON.stringify(boardColumns), actor, now, now);

  appendEvent(id, 'BoardCreated', { name: name.trim(), columns: boardColumns }, actor);

  const board = db.prepare('SELECT * FROM boards WHERE id = ?').get(id);
  res.status(201).json(board);
});

writeRouter.post('/api/boards/:boardId/cards', (req: Request, res: Response) => {
  const { boardId } = req.params;
  const { title, description, actorId } = req.body;
  if (!title) { res.status(400).json({ error: 'title is required' }); return; }

  const board = db.prepare('SELECT id, columns FROM boards WHERE id = ?').get(boardId) as BoardRow | undefined;
  if (!board) { res.status(404).json({ error: 'Board not found' }); return; }

  const columns: string[] = JSON.parse(board.columns);
  const column = req.body.column ?? columns[0] ?? 'todo';
  const actor = actorId ?? 'web-user';
  const id = randomUUID();
  const now = new Date().toISOString();
  const position = getMaxPosition(boardId, column);

  db.prepare(
    'INSERT INTO cards (id, title, description, column_name, position, board_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(id, title, description ?? '', column, position, boardId, now, now);

  appendEvent(id, 'CardCreated', { title, description: description ?? '', column, position, boardId }, actor);

  const card = db.prepare('SELECT * FROM cards WHERE id = ?').get(id);
  res.status(201).json(card);
});

writeRouter.patch('/api/cards/:id/move', (req: Request, res: Response) => {
  const { id } = req.params;
  const { toColumn, actorId } = req.body;
  if (!toColumn) { res.status(400).json({ error: 'toColumn is required' }); return; }

  const card = db.prepare('SELECT * FROM cards WHERE id = ?').get(id) as CardRow | undefined;
  if (!card) { res.status(404).json({ error: 'Card not found' }); return; }

  const actor = actorId ?? 'web-user';
  const now = new Date().toISOString();
  const position = getMaxPosition(card.board_id, toColumn);

  db.prepare(
    'UPDATE cards SET column_name = ?, position = ?, updated_at = ? WHERE id = ?'
  ).run(toColumn, position, now, id);

  appendEvent(id, 'CardMoved', { fromColumn: card.column_name, toColumn, position }, actor);

  const updated = db.prepare('SELECT * FROM cards WHERE id = ?').get(id);
  res.status(200).json(updated);
});

writeRouter.patch('/api/cards/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, description, actorId } = req.body;

  const card = db.prepare('SELECT * FROM cards WHERE id = ?').get(id) as CardRow | undefined;
  if (!card) { res.status(404).json({ error: 'Card not found' }); return; }

  if (title === undefined && description === undefined) {
    res.status(400).json({ error: 'title or description is required' }); return;
  }

  const actor = actorId ?? 'web-user';
  const now = new Date().toISOString();
  const newTitle = title ?? card.title;
  const newDesc = description ?? card.description;

  db.prepare(
    'UPDATE cards SET title = ?, description = ?, updated_at = ? WHERE id = ?'
  ).run(newTitle, newDesc, now, id);

  appendEvent(id, 'CardUpdated', { title: newTitle, description: newDesc }, actor);

  const updated = db.prepare('SELECT * FROM cards WHERE id = ?').get(id);
  res.status(200).json(updated);
});

writeRouter.post('/api/cards/:id/comments', (req: Request, res: Response) => {
  const { id: cardId } = req.params;
  const { text, actorId, parentCommentId } = req.body;
  if (!text) { res.status(400).json({ error: 'text is required' }); return; }

  const card = db.prepare('SELECT id FROM cards WHERE id = ?').get(cardId);
  if (!card) { res.status(404).json({ error: 'Card not found' }); return; }

  const actor = actorId ?? 'web-user';
  const commentId = randomUUID();
  const now = new Date().toISOString();

  db.prepare(
    'INSERT INTO comments (id, card_id, parent_comment_id, author_id, text, created_at) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(commentId, cardId, parentCommentId ?? null, actor, text, now);

  appendEvent(cardId, 'CommentAdded', { commentId, text, parentCommentId: parentCommentId ?? null }, actor);

  const comment = db.prepare('SELECT * FROM comments WHERE id = ?').get(commentId);
  res.status(201).json(comment);
});

writeRouter.patch('/api/comments/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { text, actorId } = req.body;
  if (!text || (typeof text === 'string' && text.trim() === '')) {
    res.status(400).json({ error: 'text is required' }); return;
  }

  const comment = db.prepare('SELECT * FROM comments WHERE id = ?').get(id) as
    { id: string; card_id: string; text: string } | undefined;
  if (!comment) { res.status(404).json({ error: 'Comment not found' }); return; }

  const actor = actorId ?? 'web-user';
  const now = new Date().toISOString();

  db.prepare('UPDATE comments SET text = ? WHERE id = ?').run(text.trim(), id);

  appendEvent(comment.card_id, 'CommentUpdated', { commentId: id, text: text.trim() }, actor);

  const updated = db.prepare('SELECT * FROM comments WHERE id = ?').get(id);
  res.status(200).json(updated);
});
