import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';
import { db } from './db.js';

const projectRoot = join(fileURLToPath(import.meta.url), '..', '..', '..', '..');
const orgPath = join(projectRoot, 'data', 'org.yaml');

interface AgentEntry {
  id: string;
  display_name: string;
}

let agentCache: Map<string, string> | null = null;

function loadAgents(): Map<string, string> {
  if (agentCache) return agentCache;
  try {
    const raw = readFileSync(orgPath, 'utf-8');
    const config = parse(raw);
    const agents = (config.agents || []) as AgentEntry[];
    agentCache = new Map(agents.map(a => [a.id, a.display_name]));
  } catch {
    agentCache = new Map();
  }
  return agentCache;
}

export function getActorName(actorId: string): string {
  return loadAgents().get(actorId) ?? actorId;
}

export function getBoardName(boardId: string): string {
  const row = db.prepare('SELECT name FROM boards WHERE id = ?')
    .get(boardId) as { name: string } | undefined;
  return row?.name ?? 'Unknown Board';
}
