import { Router, type Request, type Response } from 'express';
import { randomUUID } from 'node:crypto';
import { db } from './db.js';
import { writeAudit } from './audit-writer.js';
import { appendEvent } from './write-helpers.js';
import { canAccessBoard } from './board-access.js';

export const boardLabelRouter = Router();

boardLabelRouter.get('/api/boards/:id/labels', (req: Request, res: Response) => {
  const { id } = req.params;
  const board = db.prepare('SELECT id FROM boards WHERE id = ?').get(id);
  if (!board) { res.status(404).json({ error: 'Board not found' }); return; }

  const labels = db.prepare(
    'SELECT * FROM board_labels WHERE board_id = ? ORDER BY name',
  ).all(id);
  res.json(labels);
});

boardLabelRouter.post('/api/boards/:id/labels', (req: Request, res: Response) => {
  const { id: boardId } = req.params;
  const { name, color, actorId } = req.body;
  if (!name) { res.status(400).json({ error: 'name is required' }); return; }

  const board = db.prepare('SELECT id, name FROM boards WHERE id = ?').get(boardId) as any;
  if (!board) { res.status(404).json({ error: 'Board not found' }); return; }

  const actor = actorId ?? 'web-user';
  if (!canAccessBoard(db, boardId, actor)) {
    res.status(403).json({ error: 'Access denied' }); return;
  }

  const labelId = randomUUID();
  const now = new Date().toISOString();
  const labelColor = color ?? '#888888';

  db.prepare(
    'INSERT INTO board_labels (id, board_id, name, color, created_at) VALUES (?, ?, ?, ?, ?)',
  ).run(labelId, boardId, name, labelColor, now);

  appendEvent(boardId, 'BoardLabelCreated', { labelId, name, color: labelColor }, actor);
  writeAudit({
    actor, action: 'board-label.created', target: `label:${labelId}`,
    targetTitle: name, board: boardId,
    delta: { name: { to: name }, color: { to: labelColor } },
  });

  const label = db.prepare('SELECT * FROM board_labels WHERE id = ?').get(labelId);
  res.status(201).json(label);
});

boardLabelRouter.patch('/api/labels/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, color, actorId } = req.body;

  const label = db.prepare('SELECT * FROM board_labels WHERE id = ?').get(id) as any;
  if (!label) { res.status(404).json({ error: 'Label not found' }); return; }

  const actor = actorId ?? 'web-user';
  const newName = name ?? label.name;
  const newColor = color ?? label.color;

  db.prepare('UPDATE board_labels SET name = ?, color = ? WHERE id = ?')
    .run(newName, newColor, id);

  appendEvent(label.board_id, 'BoardLabelUpdated', { labelId: id, name: newName, color: newColor }, actor);
  writeAudit({
    actor, action: 'board-label.updated', target: `label:${id}`,
    targetTitle: newName, board: label.board_id,
    delta: buildDelta(label, newName, newColor),
  });

  const updated = db.prepare('SELECT * FROM board_labels WHERE id = ?').get(id);
  res.json(updated);
});

boardLabelRouter.delete('/api/labels/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const actorId = (req.query.actorId as string) ?? 'web-user';

  const label = db.prepare('SELECT * FROM board_labels WHERE id = ?').get(id) as any;
  if (!label) { res.status(404).json({ error: 'Label not found' }); return; }

  db.prepare('DELETE FROM card_labels WHERE label = ?').run(label.name);
  db.prepare('DELETE FROM board_labels WHERE id = ?').run(id);

  appendEvent(label.board_id, 'BoardLabelRemoved', { labelId: id, name: label.name }, actorId);
  writeAudit({
    actor: actorId, action: 'board-label.removed', target: `label:${id}`,
    targetTitle: label.name, board: label.board_id,
    delta: { name: { from: label.name } },
  });

  res.json({ removed: true, labelId: id });
});

function buildDelta(label: any, newName: string, newColor: string) {
  const delta: Record<string, { from?: unknown; to?: unknown }> = {};
  if (newName !== label.name) delta.name = { from: label.name, to: newName };
  if (newColor !== label.color) delta.color = { from: label.color, to: newColor };
  return Object.keys(delta).length > 0 ? delta : null;
}
