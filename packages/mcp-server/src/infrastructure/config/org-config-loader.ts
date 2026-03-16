import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import type { OrgConfig } from '../../domain/agent-config.js';

const VALID_ROLE_TYPES = new Set(['executive', 'lead', 'ic']);

export function loadOrgConfig(path: string): OrgConfig {
  const raw = readFileSync(path, 'utf-8');
  const parsed = parse(raw);
  return validateOrgConfig(parsed);
}

function validateOrgConfig(data: unknown): OrgConfig {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid org config: expected an object');
  }
  const obj = data as Record<string, unknown>;
  validateOrgField(obj);
  validateAgentsField(obj);
  return obj as unknown as OrgConfig;
}

function validateOrgField(obj: Record<string, unknown>): void {
  if (!obj.org || typeof obj.org !== 'object') {
    throw new Error('Invalid org config: missing "org" field');
  }
  const org = obj.org as Record<string, unknown>;
  if (typeof org.name !== 'string' || !org.name) {
    throw new Error('Invalid org config: org.name must be a non-empty string');
  }
}

function validateAgentsField(obj: Record<string, unknown>): void {
  if (!Array.isArray(obj.agents) || obj.agents.length === 0) {
    throw new Error('Invalid org config: missing "agents" array');
  }
  for (const agent of obj.agents) {
    validateAgent(agent);
  }
}

function validateAgent(agent: unknown): void {
  if (!agent || typeof agent !== 'object') {
    throw new Error('Invalid agent config: expected an object');
  }
  const a = agent as Record<string, unknown>;
  if (typeof a.id !== 'string' || !a.id) {
    throw new Error('Invalid agent: missing id');
  }
  if (typeof a.display_name !== 'string' || !a.display_name) {
    throw new Error('Invalid agent: missing display_name');
  }
  if (!VALID_ROLE_TYPES.has(a.role_type as string)) {
    throw new Error(`Invalid agent: role_type must be one of ${[...VALID_ROLE_TYPES].join(', ')}`);
  }
  validateIdentity(a.identity);
}

function validateIdentity(identity: unknown): void {
  if (!identity || typeof identity !== 'object') {
    throw new Error('Invalid agent: missing identity');
  }
  const id = identity as Record<string, unknown>;
  if (typeof id.email !== 'string' || !id.email) {
    throw new Error('Invalid agent identity: missing email');
  }
}
