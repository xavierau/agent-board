import { type AuditEntry, appendAudit, extractMentions } from './audit-log.js';
import { getActorName, getBoardName } from './audit-helpers.js';

interface AuditParams {
  actor: string;
  action: string;
  target: string;
  targetTitle: string;
  board: string;
  delta: AuditEntry['delta'];
  text?: string;
}

export function writeAudit(params: AuditParams): void {
  const mentions = params.text
    ? extractMentions(params.text)
    : [];

  appendAudit({
    ts: new Date().toISOString(),
    actor: params.actor,
    actorName: getActorName(params.actor),
    action: params.action,
    target: params.target,
    targetTitle: params.targetTitle,
    delta: params.delta,
    mentions,
    board: params.board,
    boardName: getBoardName(params.board),
  });
}
