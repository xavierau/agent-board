import { Router, type Request, type Response } from 'express';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';

const projectRoot = join(fileURLToPath(import.meta.url), '..', '..', '..', '..');
const orgPath = join(projectRoot, 'data', 'org.yaml');

export const agentRouter = Router();

interface AgentEntry {
  id: string;
  display_name: string;
  role_type: string;
  identity: { email: string };
}

function formatAgent(agent: AgentEntry) {
  return {
    id: agent.id,
    display_name: agent.display_name,
    role_type: agent.role_type,
    email: agent.identity.email,
  };
}

agentRouter.get('/api/agents', (_req: Request, res: Response) => {
  try {
    const raw = readFileSync(orgPath, 'utf-8');
    const config = parse(raw);
    const agents = (config.agents || []) as AgentEntry[];
    res.json(agents.map(formatAgent));
  } catch (err) {
    res.status(500).json({ error: 'Failed to load agent config' });
  }
});
