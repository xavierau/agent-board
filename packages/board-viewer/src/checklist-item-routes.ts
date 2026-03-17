import { Router, type Request, type Response } from 'express';
import { randomUUID } from 'node:crypto';
import { db } from './db.js';
import { writeAudit } from './audit-writer.js';
import { appendEvent } from './write-helpers.js';

export const checklistItemRouter = Router();

checklistItemRouter.post('/api/checklists/:id/items', (req: Request, res: Response) => {
  const { id: checklistId } = req.params;
  const { text, actorId } = req.body;
  if (!text) { res.status(400).json({ error: 'text is required' }); return; }

  const checklist = db.prepare('SELECT * FROM checklists WHERE id = ?').get(checklistId) as any;
  if (!checklist) { res.status(404).json({ error: 'Checklist not found' }); return; }

  const card = db.prepare('SELECT board_id FROM cards WHERE id = ?').get(checklist.card_id) as any;
  const actor = actorId ?? 'web-user';
  const itemId = randomUUID();
  const now = new Date().toISOString();
  const position = getNextItemPosition(checklistId);

  db.prepare(
    'INSERT INTO checklist_items (id, checklist_id, text, completed, position, created_at) VALUES (?, ?, ?, 0, ?, ?)',
  ).run(itemId, checklistId, text, position, now);

  appendEvent(checklist.card_id, 'ChecklistItemAdded', {
    checklistId, itemId, text, position,
  }, actor);

  writeAudit({
    actor, action: 'checklist-item.added', target: `checklist-item:${itemId}`,
    targetTitle: text, board: card?.board_id ?? '',
    delta: { text: { to: text } },
  });

  const item = db.prepare('SELECT * FROM checklist_items WHERE id = ?').get(itemId);
  res.status(201).json(item);
});

checklistItemRouter.patch('/api/checklist-items/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { text, completed, actorId } = req.body;

  const item = db.prepare('SELECT * FROM checklist_items WHERE id = ?').get(id) as any;
  if (!item) { res.status(404).json({ error: 'Checklist item not found' }); return; }

  const checklist = db.prepare('SELECT * FROM checklists WHERE id = ?').get(item.checklist_id) as any;
  const card = db.prepare('SELECT board_id FROM cards WHERE id = ?').get(checklist?.card_id) as any;
  const actor = actorId ?? 'web-user';

  if (text !== undefined) {
    db.prepare('UPDATE checklist_items SET text = ? WHERE id = ?').run(text, id);
    appendEvent(checklist.card_id, 'ChecklistItemUpdated', {
      checklistId: item.checklist_id, itemId: id, text,
    }, actor);
  }

  if (completed !== undefined) {
    db.prepare('UPDATE checklist_items SET completed = ? WHERE id = ?').run(completed ? 1 : 0, id);
    appendEvent(checklist.card_id, 'ChecklistItemToggled', {
      checklistId: item.checklist_id, itemId: id, completed,
    }, actor);
  }

  writeAudit({
    actor, action: 'checklist-item.updated', target: `checklist-item:${id}`,
    targetTitle: text ?? item.text, board: card?.board_id ?? '',
    delta: buildItemDelta(item, text, completed),
  });

  const updated = db.prepare('SELECT * FROM checklist_items WHERE id = ?').get(id);
  res.json(updated);
});

checklistItemRouter.delete('/api/checklist-items/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const actorId = (req.query.actorId as string) ?? 'web-user';

  const item = db.prepare('SELECT * FROM checklist_items WHERE id = ?').get(id) as any;
  if (!item) { res.status(404).json({ error: 'Checklist item not found' }); return; }

  const checklist = db.prepare('SELECT * FROM checklists WHERE id = ?').get(item.checklist_id) as any;
  const card = db.prepare('SELECT board_id FROM cards WHERE id = ?').get(checklist?.card_id) as any;

  db.prepare('DELETE FROM checklist_items WHERE id = ?').run(id);

  appendEvent(checklist?.card_id ?? '', 'ChecklistItemRemoved', {
    checklistId: item.checklist_id, itemId: id,
  }, actorId);

  writeAudit({
    actor: actorId, action: 'checklist-item.removed', target: `checklist-item:${id}`,
    targetTitle: item.text, board: card?.board_id ?? '',
    delta: { text: { from: item.text } },
  });

  res.json({ removed: true, itemId: id });
});

function getNextItemPosition(checklistId: string): number {
  const row = db.prepare(
    'SELECT MAX(position) as max_pos FROM checklist_items WHERE checklist_id = ?',
  ).get(checklistId) as { max_pos: number | null } | undefined;
  return (row?.max_pos ?? -1) + 1;
}

function buildItemDelta(item: any, text?: string, completed?: boolean) {
  const delta: Record<string, { from?: unknown; to?: unknown }> = {};
  if (text !== undefined && text !== item.text) {
    delta.text = { from: item.text, to: text };
  }
  if (completed !== undefined && completed !== !!item.completed) {
    delta.completed = { from: !!item.completed, to: completed };
  }
  return Object.keys(delta).length > 0 ? delta : null;
}
