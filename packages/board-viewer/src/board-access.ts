import type Database from 'better-sqlite3';

type BoardRow = { owner: string; visibility: string };

export function canAccessBoard(
  db: Database.Database,
  boardId: string,
  actorId: string,
): boolean {
  const board = db.prepare(
    'SELECT owner, visibility FROM boards WHERE id = ?',
  ).get(boardId) as BoardRow | undefined;
  if (!board) return false;
  if (board.visibility === 'public') return true;
  if (board.owner === actorId) return true;
  const member = db.prepare(
    'SELECT 1 FROM board_members WHERE board_id = ? AND agent_id = ?',
  ).get(boardId, actorId);
  return !!member;
}

export function isBoardOwner(
  db: Database.Database,
  boardId: string,
  actorId: string,
): boolean {
  const board = db.prepare(
    'SELECT owner FROM boards WHERE id = ?',
  ).get(boardId) as { owner: string } | undefined;
  return board?.owner === actorId;
}
