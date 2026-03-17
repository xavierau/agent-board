import { Router, type Request, type Response } from 'express';
import { db } from './db.js';
import { writeAudit } from './audit-writer.js';
import { appendEvent } from './write-helpers.js';
import { canAccessBoard } from './board-access.js';

export const cardLabelRouter = Router();

cardLabelRouter.post('/api/cards/:id/labels', (req: Request, res: Response) => {
  const { id: cardId } = req.params;
  const { labelId, actorId } = req.body;
  if (!labelId) { res.status(400).json({ error: 'labelId is required' }); return; }

  const card = db.prepare('SELECT * FROM cards WHERE id = ?').get(cardId) as any;
  if (!card) { res.status(404).json({ error: 'Card not found' }); return; }

  const actor = actorId ?? 'web-user';
  if (!canAccessBoard(db, card.board_id, actor)) {
    res.status(403).json({ error: 'Access denied' }); return;
  }

  const boardLabel = db.prepare('SELECT * FROM board_labels WHERE id = ?').get(labelId) as any;
  if (!boardLabel) { res.status(404).json({ error: 'Board label not found' }); return; }

  const now = new Date().toISOString();
  db.prepare(
    'INSERT OR REPLACE INTO card_labels (card_id, label, color, added_at) VALUES (?, ?, ?, ?)',
  ).run(cardId, boardLabel.name, boardLabel.color, now);

  appendEvent(cardId, 'LabelAdded', { label: boardLabel.name, color: boardLabel.color }, actor);
  writeAudit({
    actor, action: 'card.label-added', target: `card:${cardId}`,
    targetTitle: card.title, board: card.board_id,
    delta: { label: { to: boardLabel.name } },
  });

  res.status(201).json({ cardId, label: boardLabel.name, color: boardLabel.color });
});

cardLabelRouter.delete('/api/cards/:id/labels/:labelName', (req: Request, res: Response) => {
  const { id: cardId, labelName } = req.params;
  const actorId = (req.query.actorId as string) ?? 'web-user';

  const card = db.prepare('SELECT * FROM cards WHERE id = ?').get(cardId) as any;
  if (!card) { res.status(404).json({ error: 'Card not found' }); return; }

  if (!canAccessBoard(db, card.board_id, actorId)) {
    res.status(403).json({ error: 'Access denied' }); return;
  }

  db.prepare('DELETE FROM card_labels WHERE card_id = ? AND label = ?').run(cardId, labelName);

  appendEvent(cardId, 'LabelRemoved', { label: labelName }, actorId);
  writeAudit({
    actor: actorId, action: 'card.label-removed', target: `card:${cardId}`,
    targetTitle: card.title, board: card.board_id,
    delta: { label: { from: labelName } },
  });

  res.json({ removed: true, cardId, label: labelName });
});
