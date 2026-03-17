import { Router, type Request, type Response } from 'express';
import { db } from './db.js';
import { writeAudit } from './audit-writer.js';
import { appendEvent } from './write-helpers.js';
import { isBoardOwner } from './board-access.js';

export const boardAccessRouter = Router();

type BoardRow = { id: string; name: string; owner: string; visibility: string };

boardAccessRouter.patch('/api/boards/:id/visibility', (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { visibility, actorId } = req.body;
  if (!visibility || !['public', 'private'].includes(visibility)) {
    res.status(400).json({ error: 'visibility must be "public" or "private"' }); return;
  }

  const board = db.prepare('SELECT * FROM boards WHERE id = ?').get(id) as BoardRow | undefined;
  if (!board) { res.status(404).json({ error: 'Board not found' }); return; }

  const actor = actorId ?? 'web-user';
  if (!isBoardOwner(db, id, actor)) {
    res.status(403).json({ error: 'Only the board owner can change visibility' }); return;
  }

  db.prepare('UPDATE boards SET visibility = ?, updated_at = ? WHERE id = ?')
    .run(visibility, new Date().toISOString(), id);
  appendEvent(id, 'BoardVisibilityChanged', { visibility }, actor);
  writeAudit({
    actor, action: 'board.visibility_changed', target: `board:${id}`,
    targetTitle: board.name, board: id,
    delta: { visibility: { from: board.visibility, to: visibility } },
  });

  res.json(db.prepare('SELECT * FROM boards WHERE id = ?').get(id));
});

boardAccessRouter.patch('/api/boards/:id/owner', (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { newOwnerId, actorId } = req.body;
  if (!newOwnerId) { res.status(400).json({ error: 'newOwnerId is required' }); return; }

  const board = db.prepare('SELECT * FROM boards WHERE id = ?').get(id) as BoardRow | undefined;
  if (!board) { res.status(404).json({ error: 'Board not found' }); return; }

  const actor = actorId ?? 'web-user';
  if (!isBoardOwner(db, id, actor)) {
    res.status(403).json({ error: 'Only the board owner can transfer ownership' }); return;
  }

  db.prepare('UPDATE boards SET owner = ?, updated_at = ? WHERE id = ?')
    .run(newOwnerId, new Date().toISOString(), id);
  appendEvent(id, 'BoardOwnershipTransferred', { fromOwner: board.owner, toOwner: newOwnerId }, actor);
  writeAudit({
    actor, action: 'board.ownership_transferred', target: `board:${id}`,
    targetTitle: board.name, board: id,
    delta: { owner: { from: board.owner, to: newOwnerId } },
  });

  res.json(db.prepare('SELECT * FROM boards WHERE id = ?').get(id));
});

boardAccessRouter.post('/api/boards/:id/members', (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { memberId, actorId } = req.body;
  if (!memberId) { res.status(400).json({ error: 'memberId is required' }); return; }

  const board = db.prepare('SELECT * FROM boards WHERE id = ?').get(id) as BoardRow | undefined;
  if (!board) { res.status(404).json({ error: 'Board not found' }); return; }

  const actor = actorId ?? 'web-user';
  if (!isBoardOwner(db, id, actor)) {
    res.status(403).json({ error: 'Only the board owner can add members' }); return;
  }

  db.prepare('INSERT OR IGNORE INTO board_members (board_id, agent_id, added_at) VALUES (?, ?, ?)')
    .run(id, memberId, new Date().toISOString());
  appendEvent(id, 'BoardMemberAdded', { memberId }, actor);
  writeAudit({
    actor, action: 'board.member_added', target: `board:${id}`,
    targetTitle: board.name, board: id,
    delta: { member: { to: memberId } },
  });

  const members = db.prepare('SELECT agent_id FROM board_members WHERE board_id = ?').all(id);
  res.json({ boardId: id, members: members.map((m: any) => m.agent_id) });
});

boardAccessRouter.delete('/api/boards/:id/members/:agentId', (req: Request, res: Response) => {
  const id = req.params.id as string;
  const agentId = req.params.agentId as string;
  const actorId = (req.query.actorId as string) ?? 'web-user';

  const board = db.prepare('SELECT * FROM boards WHERE id = ?').get(id) as BoardRow | undefined;
  if (!board) { res.status(404).json({ error: 'Board not found' }); return; }
  if (!isBoardOwner(db, id, actorId)) {
    res.status(403).json({ error: 'Only the board owner can remove members' }); return;
  }

  db.prepare('DELETE FROM board_members WHERE board_id = ? AND agent_id = ?').run(id, agentId);
  appendEvent(id, 'BoardMemberRemoved', { memberId: agentId }, actorId);
  writeAudit({
    actor: actorId, action: 'board.member_removed', target: `board:${id}`,
    targetTitle: board.name, board: id,
    delta: { member: { from: agentId } },
  });

  const members = db.prepare('SELECT agent_id FROM board_members WHERE board_id = ?').all(id);
  res.json({ boardId: id, members: members.map((m: any) => m.agent_id) });
});
