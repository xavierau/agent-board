import { appendFileSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = join(fileURLToPath(import.meta.url), '..', '..', '..', '..');
const AUDIT_FILE = join(projectRoot, 'data', 'audit.jsonl');

export interface AuditEntry {
  ts: string;
  actor: string;
  actorName: string;
  action: string;
  target: string;
  targetTitle: string;
  delta: Record<string, { from?: unknown; to?: unknown }> | null;
  mentions: string[];
  board: string;
  boardName: string;
}

export interface ReadOptions {
  limit?: number;
  board?: string;
  actor?: string;
}

export function extractMentions(text: string): string[] {
  const matches = text.match(/@([a-zA-Z0-9_-]+)/g);
  return matches ? matches.map(m => m.slice(1)) : [];
}

export function appendAudit(entry: AuditEntry): void {
  appendFileSync(AUDIT_FILE, JSON.stringify(entry) + '\n');
}

export function readAuditLog(options?: ReadOptions): AuditEntry[] {
  if (!existsSync(AUDIT_FILE)) return [];
  const content = readFileSync(AUDIT_FILE, 'utf-8').trim();
  if (!content) return [];

  let entries = content.split('\n')
    .filter(Boolean)
    .map(line => JSON.parse(line) as AuditEntry);

  if (options?.board) entries = entries.filter(e => e.board === options.board);
  if (options?.actor) entries = entries.filter(e => e.actor === options.actor);

  entries.reverse();
  if (options?.limit) entries = entries.slice(0, options.limit);
  return entries;
}
