import { Router, type Request, type Response } from 'express';
import { randomUUID } from 'node:crypto';
import { db } from './db.js';
import { writeAudit } from './audit-writer.js';
import { appendEvent } from './write-helpers.js';
import { canAccessBoard } from './board-access.js';

export const checklistRouter = Router();

checklistRouter.get('/api/cards/:id/checklists', (req: Request, res: Response) => {
  const card = db.prepare('SELECT id, board_id FROM cards WHERE id = ?').get(req.params.id) as any;
  if (!card) { res.status(404).json({ error: 'Card not found' }); return; }

  const checklists = getChecklistsWithItems(req.params.id);
  res.json(checklists);
});

checklistRouter.post('/api/cards/:id/checklists', (req: Request, res: Response) => {
  const { id: cardId } = req.params;
  const { title, actorId } = req.body;
  if (!title) { res.status(400).json({ error: 'title is required' }); return; }

  const card = db.prepare('SELECT id, board_id FROM cards WHERE id = ?').get(cardId) as any;
  if (!card) { res.status(404).json({ error: 'Card not found' }); return; }

  const actor = actorId ?? 'web-user';
  if (!canAccessBoard(db, card.board_id, actor)) {
    res.status(403).json({ error: 'Access denied' }); return;
  }

  const id = randomUUID();
  const now = new Date().toISOString();
  const position = getNextChecklistPosition(cardId);

  db.prepare(
    'INSERT INTO checklists (id, card_id, title, position, created_at) VALUES (?, ?, ?, ?, ?)',
  ).run(id, cardId, title, position, now);

  appendEvent(cardId, 'ChecklistCreated', { checklistId: id, title, position }, actor);
  writeAudit({
    actor, action: 'checklist.created', target: `checklist:${id}`,
    targetTitle: title, board: card.board_id,
    delta: { title: { to: title } },
  });

  res.status(201).json({ id, card_id: cardId, title, position, created_at: now, items: [] });
});

checklistRouter.delete('/api/checklists/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const actorId = (req.query.actorId as string) ?? 'web-user';

  const checklist = db.prepare('SELECT * FROM checklists WHERE id = ?').get(id) as any;
  if (!checklist) { res.status(404).json({ error: 'Checklist not found' }); return; }

  const card = db.prepare('SELECT board_id FROM cards WHERE id = ?').get(checklist.card_id) as any;

  db.prepare('DELETE FROM checklist_items WHERE checklist_id = ?').run(id);
  db.prepare('DELETE FROM checklists WHERE id = ?').run(id);

  appendEvent(checklist.card_id, 'ChecklistRemoved', { checklistId: id }, actorId);
  writeAudit({
    actor: actorId, action: 'checklist.removed', target: `checklist:${id}`,
    targetTitle: checklist.title, board: card?.board_id ?? '',
    delta: { title: { from: checklist.title } },
  });

  res.json({ removed: true, checklistId: id });
});

function getChecklistsWithItems(cardId: string) {
  const rows = db.prepare(
    'SELECT * FROM checklists WHERE card_id = ? ORDER BY position',
  ).all(cardId) as any[];
  return rows.map((cl) => ({
    ...cl,
    items: db.prepare(
      'SELECT * FROM checklist_items WHERE checklist_id = ? ORDER BY position',
    ).all(cl.id),
  }));
}

function getNextChecklistPosition(cardId: string): number {
  const row = db.prepare(
    'SELECT MAX(position) as max_pos FROM checklists WHERE card_id = ?',
  ).get(cardId) as { max_pos: number | null } | undefined;
  return (row?.max_pos ?? -1) + 1;
}
