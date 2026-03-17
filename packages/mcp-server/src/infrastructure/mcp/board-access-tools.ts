import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { McpDeps } from './types.js';
import {
  setBoardVisibilitySchema,
  transferBoardOwnershipSchema,
  addBoardMemberSchema,
  removeBoardMemberSchema,
} from './tool-schemas.js';
import { jsonResult, validateActor, getActorInfo } from './tool-helpers.js';

export function registerBoardAccessTools(
  server: McpServer,
  deps: McpDeps,
): void {
  registerSetVisibility(server, deps);
  registerTransferOwnership(server, deps);
  registerAddMember(server, deps);
  registerRemoveMember(server, deps);
}

function registerSetVisibility(
  server: McpServer,
  deps: McpDeps,
): void {
  server.registerTool('set-board-visibility', {
    description: 'Set a board to public or private',
    inputSchema: setBoardVisibilitySchema,
  }, async (input) => {
    const err = validateActor(deps.actorValidator, input.actorId);
    if (err) return err;
    const result = deps.useCases.setBoardVisibility.execute(input);
    const actor = getActorInfo(deps.agentRegistry, input.actorId);
    return jsonResult({ ...result, actor });
  });
}

function registerTransferOwnership(
  server: McpServer,
  deps: McpDeps,
): void {
  server.registerTool('transfer-board-ownership', {
    description: 'Transfer board ownership to another agent',
    inputSchema: transferBoardOwnershipSchema,
  }, async (input) => {
    const err = validateActor(deps.actorValidator, input.actorId);
    if (err) return err;
    const result = deps.useCases.transferBoardOwnership.execute(input);
    const actor = getActorInfo(deps.agentRegistry, input.actorId);
    return jsonResult({ ...result, actor });
  });
}

function registerAddMember(
  server: McpServer,
  deps: McpDeps,
): void {
  server.registerTool('add-board-member', {
    description: 'Add a member to a board',
    inputSchema: addBoardMemberSchema,
  }, async (input) => {
    const err = validateActor(deps.actorValidator, input.actorId);
    if (err) return err;
    const result = deps.useCases.addBoardMember.execute(input);
    const actor = getActorInfo(deps.agentRegistry, input.actorId);
    return jsonResult({ ...result, actor });
  });
}

function registerRemoveMember(
  server: McpServer,
  deps: McpDeps,
): void {
  server.registerTool('remove-board-member', {
    description: 'Remove a member from a board',
    inputSchema: removeBoardMemberSchema,
  }, async (input) => {
    const err = validateActor(deps.actorValidator, input.actorId);
    if (err) return err;
    const result = deps.useCases.removeBoardMember.execute(input);
    const actor = getActorInfo(deps.agentRegistry, input.actorId);
    return jsonResult({ ...result, actor });
  });
}
