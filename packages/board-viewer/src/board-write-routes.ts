import { Router, type Request, type Response } from 'express';
import { randomUUID } from 'node:crypto';
import { db } from './db.js';
import { writeAudit } from './audit-writer.js';
import { appendEvent, type BoardRow } from './write-helpers.js';

export const boardWriteRouter = Router();

boardWriteRouter.post('/api/boards', (req: Request, res: Response) => {
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
    'INSERT INTO boards (id, name, columns, created_by, owner, visibility, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(id, name.trim(), JSON.stringify(boardColumns), actor, actor, 'public', now, now);

  appendEvent(id, 'BoardCreated', { name: name.trim(), columns: boardColumns }, actor);
  writeAudit({
    actor, action: 'board.created', target: `board:${id}`,
    targetTitle: name.trim(), board: id,
    delta: { name: { to: name.trim() }, columns: { to: boardColumns } },
  });

  const board = db.prepare('SELECT * FROM boards WHERE id = ?').get(id);
  res.status(201).json(board);
});

boardWriteRouter.patch('/api/boards/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, actorId } = req.body;
  if (!name || (typeof name === 'string' && name.trim() === '')) {
    res.status(400).json({ error: 'name is required' }); return;
  }

  const board = db.prepare('SELECT * FROM boards WHERE id = ?').get(id) as BoardRow | undefined;
  if (!board) { res.status(404).json({ error: 'Board not found' }); return; }

  const actor = actorId ?? 'web-user';
  const now = new Date().toISOString();
  const oldName = board.name;

  db.prepare('UPDATE boards SET name = ?, updated_at = ? WHERE id = ?').run(name.trim(), now, id);
  appendEvent(id, 'BoardUpdated', { name: name.trim() }, actor);
  writeAudit({
    actor, action: 'board.renamed', target: `board:${id}`,
    targetTitle: name.trim(), board: id,
    delta: { name: { from: oldName, to: name.trim() } },
  });

  const updated = db.prepare('SELECT * FROM boards WHERE id = ?').get(id);
  res.status(200).json(updated);
});
