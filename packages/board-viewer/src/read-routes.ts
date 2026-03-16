import { Router, type Request, type Response } from 'express';
import { db } from './db.js';

export const readRouter = Router();

interface CardRow {
  id: string;
  title: string;
  description: string;
  column_name: string;
  position: number;
  board_id: string;
  archived: number;
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

readRouter.get('/api/boards', (_req: Request, res: Response) => {
  const boards = db.prepare('SELECT * FROM boards ORDER BY created_at DESC').all();
  res.json(boards);
});

readRouter.get('/api/boards/:id', (req: Request, res: Response) => {
  const board = db.prepare('SELECT * FROM boards WHERE id = ?').get(req.params.id);
  if (!board) { res.status(404).json({ error: 'Board not found' }); return; }
  res.json(board);
});

readRouter.get('/api/boards/:id/cards', (req: Request, res: Response) => {
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
