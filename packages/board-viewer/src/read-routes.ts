import { Router, type Request, type Response } from 'express';
import { db } from './db.js';
import { readAuditLog } from './audit-log.js';
import { canAccessBoard } from './board-access.js';

export const readRouter = Router();

interface CardRow {
  id: string;
  title: string;
  description: string;
  column_name: string;
  position: number;
  board_id: string;
  archived: number;
  assignee: string | null;
  created_at: string;
  updated_at: string;
  label_data: string | null;
}

function parseLabels(labelData: string | null) {
  if (!labelData) return [];
  return labelData.split(';;').map((entry) => {
    const [label, color] = entry.split('|');
    return { label, color };
  });
}

export function formatCard(row: CardRow) {
  const { label_data, archived, ...rest } = row;
  return { ...rest, archived: Boolean(archived), labels: parseLabels(label_data) };
}

readRouter.get('/api/boards', (req: Request, res: Response) => {
  const actorId = req.query.actorId as string | undefined;
  const boards = db.prepare('SELECT * FROM boards ORDER BY created_at DESC').all() as any[];
  if (!actorId) {
    res.json(boards.filter(b => b.visibility === 'public'));
    return;
  }
  res.json(boards.filter(b => canAccessBoard(db, b.id, actorId)));
});

readRouter.get('/api/boards/:id', (req: Request, res: Response) => {
  const id = req.params.id as string;
  const board = db.prepare('SELECT * FROM boards WHERE id = ?').get(id) as any;
  if (!board) { res.status(404).json({ error: 'Board not found' }); return; }
  const actorId = req.query.actorId as string | undefined;
  if (actorId && !canAccessBoard(db, id, actorId)) {
    res.status(403).json({ error: 'Access denied: board is private' }); return;
  }
  if (!actorId && board.visibility === 'private') {
    res.status(403).json({ error: 'Access denied: board is private' }); return;
  }
  const members = db.prepare('SELECT agent_id FROM board_members WHERE board_id = ?')
    .all(id) as { agent_id: string }[];
  res.json({ ...board, members: members.map(m => m.agent_id) });
});

readRouter.get('/api/boards/:id/cards', (req: Request, res: Response) => {
  const actorId = req.query.actorId as string | undefined;
  if (actorId && !canAccessBoard(db, req.params.id as string, actorId)) {
    res.status(403).json({ error: 'Access denied: board is private' }); return;
  }
  const columnFilter = req.query.column as string | undefined;
  const baseQuery = `
    SELECT c.*, GROUP_CONCAT(cl.label || '|' || cl.color, ';;') as label_data
    FROM cards c
    LEFT JOIN card_labels cl ON c.id = cl.card_id
    WHERE c.board_id = ? AND c.archived = 0`;
  const orderClause = ' GROUP BY c.id ORDER BY c.column_name, c.position';

  if (columnFilter) {
    const rows = db.prepare(baseQuery + ' AND c.column_name = ?' + orderClause)
      .all(req.params.id, columnFilter) as CardRow[];
    res.json(rows.map(formatCard));
    return;
  }
  const rows = db.prepare(baseQuery + orderClause).all(req.params.id) as CardRow[];
  res.json(rows.map(formatCard));
});

readRouter.get('/api/cards/:id', (req: Request, res: Response) => {
  const row = db.prepare(`
    SELECT c.*, GROUP_CONCAT(cl.label || '|' || cl.color, ';;') as label_data
    FROM cards c
    LEFT JOIN card_labels cl ON c.id = cl.card_id
    WHERE c.id = ?
    GROUP BY c.id`).get(req.params.id) as CardRow | undefined;
  if (!row) { res.status(404).json({ error: 'Card not found' }); return; }
  res.json(formatCard(row));
});

readRouter.get('/api/cards/:id/comments', (req: Request, res: Response) => {
  const comments = db.prepare(
    'SELECT * FROM comments WHERE card_id = ? ORDER BY created_at DESC'
  ).all(req.params.id);
  res.json(comments);
});

readRouter.get('/api/events', (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string, 10) || 50;
  const board = req.query.board as string | undefined;
  const actor = req.query.actor as string | undefined;
  res.json(readAuditLog({ limit, board, actor }));
});

readRouter.get('/api/events/raw', (req: Request, res: Response) => {
  const streamId = req.query.stream_id as string | undefined;
  if (streamId) {
    const events = db.prepare(
      'SELECT id, stream_id, event_type, payload, actor_id, occurred_at FROM events WHERE stream_id = ? ORDER BY id DESC LIMIT 50'
    ).all(streamId);
    res.json(events);
    return;
  }
  const events = db.prepare(
    'SELECT id, stream_id, event_type, payload, actor_id, occurred_at FROM events ORDER BY id DESC LIMIT 50'
  ).all();
  res.json(events);
});
