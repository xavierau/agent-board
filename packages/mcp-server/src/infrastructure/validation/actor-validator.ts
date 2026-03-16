import type { AgentConfig, OrgConfig } from '../../domain/agent-config.js';
import type { AgentRegistry } from '../../domain/repositories/agent-registry.js';

export interface ActorValidator {
  validate(actorId: string): boolean;
}

export class AllowListActorValidator implements ActorValidator {
  constructor(
    private readonly allowedActors: ReadonlySet<string>,
  ) {}

  validate(actorId: string): boolean {
    return this.allowedActors.has(actorId);
  }
}

export class OpenActorValidator implements ActorValidator {
  validate(actorId: string): boolean {
    return actorId.length > 0;
  }
}

export class OrgActorValidator implements ActorValidator, AgentRegistry {
  private readonly agents: Map<string, AgentConfig>;

  constructor(config: OrgConfig) {
    this.agents = new Map(config.agents.map(a => [a.id, a]));
  }

  validate(actorId: string): boolean {
    return this.agents.has(actorId);
  }

  getAgent(actorId: string): AgentConfig | undefined {
    return this.agents.get(actorId);
  }

  getAllAgents(): AgentConfig[] {
    return [...this.agents.values()];
  }

  isKnownAgent(id: string): boolean {
    return this.agents.has(id);
  }
}
