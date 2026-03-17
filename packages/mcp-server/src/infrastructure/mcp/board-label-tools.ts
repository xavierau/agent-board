import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { McpDeps } from './types.js';
import {
  createBoardLabelSchema,
  updateBoardLabelSchema,
  removeBoardLabelSchema,
  listBoardLabelsSchema,
} from './tool-schemas.js';
import { jsonResult, validateActor, getActorInfo, checkBoardAccess } from './tool-helpers.js';

export function registerBoardLabelTools(
  server: McpServer,
  deps: McpDeps,
): void {
  registerCreate(server, deps);
  registerUpdate(server, deps);
  registerRemove(server, deps);
  registerList(server, deps);
}

function registerCreate(server: McpServer, deps: McpDeps): void {
  server.registerTool('create-board-label', {
    description: 'Create a label in a board\'s label registry',
    inputSchema: createBoardLabelSchema,
  }, async (input) => {
    const err = validateActor(deps.actorValidator, input.actorId);
    if (err) return err;
    const access = checkBoardAccess(deps.boardReadModel, input.boardId, input.actorId);
    if (access) return access;
    const result = deps.useCases.createBoardLabel.execute(input);
    const actor = getActorInfo(deps.agentRegistry, input.actorId);
    return jsonResult({ ...result, actor });
  });
}

function registerUpdate(server: McpServer, deps: McpDeps): void {
  server.registerTool('update-board-label', {
    description: 'Update a board label\'s name or color',
    inputSchema: updateBoardLabelSchema,
  }, async (input) => {
    const err = validateActor(deps.actorValidator, input.actorId);
    if (err) return err;
    const result = deps.useCases.updateBoardLabel.execute(input);
    const actor = getActorInfo(deps.agentRegistry, input.actorId);
    return jsonResult({ ...result, actor });
  });
}

function registerRemove(server: McpServer, deps: McpDeps): void {
  server.registerTool('remove-board-label', {
    description: 'Remove a label from board registry and all cards',
    inputSchema: removeBoardLabelSchema,
  }, async (input) => {
    const err = validateActor(deps.actorValidator, input.actorId);
    if (err) return err;
    const result = deps.useCases.removeBoardLabel.execute(input);
    const actor = getActorInfo(deps.agentRegistry, input.actorId);
    return jsonResult({ ...result, actor });
  });
}

function registerList(server: McpServer, deps: McpDeps): void {
  server.registerTool('list-board-labels', {
    description: 'List all labels in a board\'s registry',
    inputSchema: listBoardLabelsSchema,
  }, async (input) => {
    const labels = deps.useCases.listBoardLabels.execute(input.boardId);
    return jsonResult({ labels });
  });
}
