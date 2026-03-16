import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { McpDeps } from './types.js';
import { createBoardSchema, listBoardsSchema } from './tool-schemas.js';
import { jsonResult, validateActor, getActorInfo } from './tool-helpers.js';

export function registerBoardTools(
  server: McpServer,
  deps: McpDeps,
): void {
  registerCreateBoard(server, deps);
  registerListBoards(server, deps);
}

function registerCreateBoard(
  server: McpServer,
  deps: McpDeps,
): void {
  server.registerTool('create-board', {
    description: 'Create a new kanban board',
    inputSchema: createBoardSchema,
  }, async (input) => {
    const err = validateActor(deps.actorValidator, input.actorId);
    if (err) return err;
    const result = deps.useCases.createBoard.execute(input);
    const actor = getActorInfo(deps.agentRegistry, input.actorId);
    return jsonResult({ ...result, actor });
  });
}

function registerListBoards(
  server: McpServer,
  { useCases }: McpDeps,
): void {
  server.registerTool('list-boards', {
    description: 'List all kanban boards',
    inputSchema: listBoardsSchema,
  }, async () => {
    return jsonResult(useCases.listBoards.execute());
  });
}
