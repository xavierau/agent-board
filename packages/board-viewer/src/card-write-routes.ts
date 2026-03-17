import { Router, type Request, type Response } from 'express';
import { randomUUID } from 'node:crypto';
import { db } from './db.js';
import { writeAudit } from './audit-writer.js';
import { appendEvent, getMaxPosition, type BoardRow, type CardRow } from './write-helpers.js';
import { canAccessBoard } from './board-access.js';

export const cardWriteRouter = Router();

cardWriteRouter.post('/api/boards/:boardId/cards', (req: Request, res: Response) => {
  const { boardId } = req.params;
  const { title, description, actorId } = req.body;
  if (!title) { res.status(400).json({ error: 'title is required' }); return; }

  const board = db.prepare('SELECT id, columns, name FROM boards WHERE id = ?').get(boardId) as (BoardRow & { name?: string }) | undefined;
  if (!board) { res.status(404).json({ error: 'Board not found' }); return; }

  const actor = actorId ?? 'web-user';
  if (!canAccessBoard(db, boardId, actor)) {
    res.status(403).json({ error: 'Access denied: board is private' }); return;
  }

  const columns: string[] = JSON.parse(board.columns);
  const column = req.body.column ?? columns[0] ?? 'todo';
  const id = randomUUID();
  const now = new Date().toISOString();
  const position = getMaxPosition(boardId, column);

  db.prepare(
    'INSERT INTO cards (id, title, description, column_name, position, board_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(id, title, description ?? '', column, position, boardId, now, now);

  appendEvent(id, 'CardCreated', { title, description: description ?? '', column, position, boardId }, actor);
  writeAudit({
    actor, action: 'card.created', target: `card:${id}`,
    targetTitle: title, board: boardId,
    delta: { title: { to: title }, column: { to: column } },
  });

  const card = db.prepare('SELECT * FROM cards WHERE id = ?').get(id);
  res.status(201).json(card);
});

cardWriteRouter.patch('/api/cards/:id/move', (req: Request, res: Response) => {
  const { id } = req.params;
  const { toColumn, actorId } = req.body;
  if (!toColumn) { res.status(400).json({ error: 'toColumn is required' }); return; }

  const card = db.prepare('SELECT * FROM cards WHERE id = ?').get(id) as CardRow | undefined;
  if (!card) { res.status(404).json({ error: 'Card not found' }); return; }

  const actor = actorId ?? 'web-user';
  if (!canAccessBoard(db, card.board_id, actor)) {
    res.status(403).json({ error: 'Access denied: board is private' }); return;
  }
  const now = new Date().toISOString();
  const position = getMaxPosition(card.board_id, toColumn);

  db.prepare(
    'UPDATE cards SET column_name = ?, position = ?, updated_at = ? WHERE id = ?'
  ).run(toColumn, position, now, id);

  appendEvent(id, 'CardMoved', { fromColumn: card.column_name, toColumn, position }, actor);
  writeAudit({
    actor, action: 'card.moved', target: `card:${id}`,
    targetTitle: card.title, board: card.board_id,
    delta: { column: { from: card.column_name, to: toColumn } },
  });

  const updated = db.prepare('SELECT * FROM cards WHERE id = ?').get(id);
  res.status(200).json(updated);
});

cardWriteRouter.patch('/api/cards/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, description, actorId } = req.body;

  const card = db.prepare('SELECT * FROM cards WHERE id = ?').get(id) as CardRow | undefined;
  if (!card) { res.status(404).json({ error: 'Card not found' }); return; }
  if (title === undefined && description === undefined) {
    res.status(400).json({ error: 'title or description is required' }); return;
  }

  const actor = actorId ?? 'web-user';
  if (!canAccessBoard(db, card.board_id, actor)) {
    res.status(403).json({ error: 'Access denied: board is private' }); return;
  }
  const now = new Date().toISOString();
  const newTitle = title ?? card.title;
  const newDesc = description ?? card.description;

  db.prepare(
    'UPDATE cards SET title = ?, description = ?, updated_at = ? WHERE id = ?'
  ).run(newTitle, newDesc, now, id);

  appendEvent(id, 'CardUpdated', { title: newTitle, description: newDesc }, actor);

  const delta: Record<string, { from?: unknown; to?: unknown }> = {};
  if (title !== undefined && title !== card.title) delta.title = { from: card.title, to: title };
  if (description !== undefined && description !== card.description) delta.description = { from: card.description, to: description };

  if (Object.keys(delta).length > 0) {
    writeAudit({
      actor, action: 'card.updated', target: `card:${id}`,
      targetTitle: newTitle, board: card.board_id, delta,
    });
  }

  const updated = db.prepare('SELECT * FROM cards WHERE id = ?').get(id);
  res.status(200).json(updated);
});
