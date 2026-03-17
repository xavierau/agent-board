import { Router, type Request, type Response } from 'express';
import { randomUUID } from 'node:crypto';
import { db } from './db.js';
import { writeAudit } from './audit-writer.js';
import { appendEvent, type CardRow } from './write-helpers.js';
import { canAccessBoard } from './board-access.js';

export const commentWriteRouter = Router();

commentWriteRouter.post('/api/cards/:id/comments', (req: Request, res: Response) => {
  const { id: cardId } = req.params;
  const { text, actorId, parentCommentId } = req.body;
  if (!text) { res.status(400).json({ error: 'text is required' }); return; }

  const card = db.prepare('SELECT * FROM cards WHERE id = ?').get(cardId) as CardRow | undefined;
  if (!card) { res.status(404).json({ error: 'Card not found' }); return; }

  const actor = actorId ?? 'web-user';
  if (!canAccessBoard(db, card.board_id, actor)) {
    res.status(403).json({ error: 'Access denied: board is private' }); return;
  }
  const commentId = randomUUID();
  const now = new Date().toISOString();

  db.prepare(
    'INSERT INTO comments (id, card_id, parent_comment_id, author_id, text, created_at) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(commentId, cardId, parentCommentId ?? null, actor, text, now);

  appendEvent(cardId, 'CommentAdded', { commentId, text, parentCommentId: parentCommentId ?? null }, actor);
  writeAudit({
    actor, action: 'comment.added', target: `card:${cardId}`,
    targetTitle: card.title, board: card.board_id,
    delta: { text: { to: text } }, text,
  });

  const comment = db.prepare('SELECT * FROM comments WHERE id = ?').get(commentId);
  res.status(201).json(comment);
});

commentWriteRouter.patch('/api/cards/:id/assign', (req: Request, res: Response) => {
  const { id } = req.params;
  const { assigneeId, actorId } = req.body;

  const card = db.prepare('SELECT * FROM cards WHERE id = ?').get(id) as CardRow | undefined;
  if (!card) { res.status(404).json({ error: 'Card not found' }); return; }

  if (assigneeId !== null && assigneeId !== undefined && typeof assigneeId !== 'string') {
    res.status(400).json({ error: 'assigneeId must be a string or null' }); return;
  }

  const actor = actorId ?? 'web-user';
  if (!canAccessBoard(db, card.board_id, actor)) {
    res.status(403).json({ error: 'Access denied: board is private' }); return;
  }
  const assignee = assigneeId === undefined ? null : assigneeId;

  db.prepare('UPDATE cards SET assignee = ? WHERE id = ?').run(assignee, id);
  appendEvent(id, 'CardAssigned', { assigneeId: assignee }, actor);
  writeAudit({
    actor, action: 'card.assigned', target: `card:${id}`,
    targetTitle: card.title, board: card.board_id,
    delta: { assignee: { from: card.assignee, to: assignee } },
  });

  const updated = db.prepare('SELECT * FROM cards WHERE id = ?').get(id);
  res.status(200).json(updated);
});

commentWriteRouter.patch('/api/comments/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { text, actorId } = req.body;
  if (!text || (typeof text === 'string' && text.trim() === '')) {
    res.status(400).json({ error: 'text is required' }); return;
  }

  const comment = db.prepare('SELECT * FROM comments WHERE id = ?').get(id) as
    { id: string; card_id: string; text: string } | undefined;
  if (!comment) { res.status(404).json({ error: 'Comment not found' }); return; }

  const card = db.prepare('SELECT * FROM cards WHERE id = ?').get(comment.card_id) as CardRow | undefined;
  const actor = actorId ?? 'web-user';
  if (card && !canAccessBoard(db, card.board_id, actor)) {
    res.status(403).json({ error: 'Access denied: board is private' }); return;
  }

  db.prepare('UPDATE comments SET text = ? WHERE id = ?').run(text.trim(), id);
  appendEvent(comment.card_id, 'CommentUpdated', { commentId: id, text: text.trim() }, actor);

  if (card) {
    writeAudit({
      actor, action: 'comment.updated', target: `card:${comment.card_id}`,
      targetTitle: card.title, board: card.board_id,
      delta: { text: { from: comment.text, to: text.trim() } },
      text: text.trim(),
    });
  }

  const updated = db.prepare('SELECT * FROM comments WHERE id = ?').get(id);
  res.status(200).json(updated);
});
