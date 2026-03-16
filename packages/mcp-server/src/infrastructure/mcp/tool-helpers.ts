import type { ActorValidator } from '../validation/actor-validator.js';
import type { AgentRegistry } from '../../domain/repositories/agent-registry.js';

type ToolResult = {
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
};

type ActorInfo = { id: string; display_name: string };

export function jsonResult(data: unknown): ToolResult {
  return {
    content: [{ type: 'text', text: JSON.stringify(data) }],
  };
}

export function errorResult(message: string): ToolResult {
  return {
    content: [{ type: 'text', text: JSON.stringify({ error: message }) }],
    isError: true,
  };
}

export function validateActor(
  validator: ActorValidator,
  actorId: string,
): ToolResult | null {
  if (!validator.validate(actorId)) {
    return errorResult(`Invalid actorId: ${actorId}`);
  }
  return null;
}

export function getActorInfo(
  registry: AgentRegistry,
  actorId: string,
): ActorInfo | undefined {
  const agent = registry.getAgent(actorId);
  if (!agent) return undefined;
  return { id: agent.id, display_name: agent.display_name };
}
