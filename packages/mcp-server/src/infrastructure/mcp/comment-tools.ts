import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { McpDeps } from './types.js';
import { addCommentSchema, listCommentsSchema } from './tool-schemas.js';
import { jsonResult, validateActor, getActorInfo } from './tool-helpers.js';

export function registerCommentTools(
  server: McpServer,
  deps: McpDeps,
): void {
  registerAddComment(server, deps);
  registerListComments(server, deps);
}

function registerAddComment(
  server: McpServer,
  deps: McpDeps,
): void {
  server.registerTool('add-comment', {
    description: 'Add a comment to a card',
    inputSchema: addCommentSchema,
  }, async (input) => {
    const err = validateActor(deps.actorValidator, input.actorId);
    if (err) return err;
    const result = deps.useCases.addComment.execute(input);
    const actor = getActorInfo(deps.agentRegistry, input.actorId);
    return jsonResult({ ...result, actor });
  });
}

function registerListComments(
  server: McpServer,
  { useCases }: McpDeps,
): void {
  server.registerTool('list-comments', {
    description: 'List comments on a card',
    inputSchema: listCommentsSchema,
  }, async (input) => {
    return jsonResult(useCases.listComments.execute(input));
  });
}
