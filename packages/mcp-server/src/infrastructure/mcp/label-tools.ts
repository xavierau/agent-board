import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { McpDeps } from './types.js';
import { addLabelSchema, removeLabelSchema } from './tool-schemas.js';
import { jsonResult, validateActor, getActorInfo, checkCardBoardAccess } from './tool-helpers.js';

export function registerLabelTools(
  server: McpServer,
  deps: McpDeps,
): void {
  registerAddLabel(server, deps);
  registerRemoveLabel(server, deps);
}

function registerAddLabel(
  server: McpServer,
  deps: McpDeps,
): void {
  server.registerTool('add-label', {
    description: 'Add a label to a card',
    inputSchema: addLabelSchema,
  }, async (input) => {
    const err = validateActor(deps.actorValidator, input.actorId);
    if (err) return err;
    const access = checkCardBoardAccess(deps.cardReadModel, deps.boardReadModel, input.cardId, input.actorId);
    if (access) return access;
    const result = deps.useCases.addLabel.execute(input);
    const actor = getActorInfo(deps.agentRegistry, input.actorId);
    return jsonResult({ ...result, actor });
  });
}

function registerRemoveLabel(
  server: McpServer,
  deps: McpDeps,
): void {
  server.registerTool('remove-label', {
    description: 'Remove a label from a card',
    inputSchema: removeLabelSchema,
  }, async (input) => {
    const err = validateActor(deps.actorValidator, input.actorId);
    if (err) return err;
    const access = checkCardBoardAccess(deps.cardReadModel, deps.boardReadModel, input.cardId, input.actorId);
    if (access) return access;
    const result = deps.useCases.removeLabel.execute(input);
    const actor = getActorInfo(deps.agentRegistry, input.actorId);
    return jsonResult({ ...result, actor });
  });
}
