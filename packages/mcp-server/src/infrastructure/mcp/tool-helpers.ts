import type { ActorValidator } from '../validation/actor-validator.js';
import type { AgentRegistry } from '../../domain/repositories/agent-registry.js';
import type { BoardReadModel } from '../../domain/repositories/board-read-model.js';
import type { CardReadModel } from '../../domain/repositories/card-read-model.js';
import { canAccessBoard } from '../../domain/services/board-access.js';

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

export function checkBoardAccess(
  boardReadModel: BoardReadModel,
  boardId: string,
  actorId: string,
): ToolResult | null {
  const board = boardReadModel.findById(boardId);
  if (!board) return errorResult('Board not found');
  if (!canAccessBoard(board, actorId)) {
    return errorResult('Access denied: board is private');
  }
  return null;
}

export function checkCardBoardAccess(
  cardReadModel: CardReadModel,
  boardReadModel: BoardReadModel,
  cardId: string,
  actorId: string,
): ToolResult | null {
  const card = cardReadModel.findById(cardId);
  if (!card) return errorResult('Card not found');
  return checkBoardAccess(boardReadModel, card.boardId, actorId);
}
