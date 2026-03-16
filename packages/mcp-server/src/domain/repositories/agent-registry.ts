import type { AgentConfig } from '../agent-config.js';

export interface AgentRegistry {
  getAgent(id: string): AgentConfig | undefined;
  getAllAgents(): AgentConfig[];
  isKnownAgent(id: string): boolean;
}
