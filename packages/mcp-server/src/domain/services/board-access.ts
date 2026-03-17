export type BoardAccessInfo = {
  readonly visibility: 'public' | 'private';
  readonly owner: string;
  readonly members: readonly string[];
};

export function canAccessBoard(
  board: BoardAccessInfo,
  actorId: string,
): boolean {
  if (board.visibility === 'public') return true;
  return isBoardOwner(board, actorId) || board.members.includes(actorId);
}

export function isBoardOwner(
  board: BoardAccessInfo,
  actorId: string,
): boolean {
  return board.owner === actorId;
}
