import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { McpDeps } from './types.js';
import { createBoardSchema, listBoardsSchema } from './tool-schemas.js';
import { canAccessBoard } from '../../domain/services/board-access.js';
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
  deps: McpDeps,
): void {
  server.registerTool('list-boards', {
    description: 'List kanban boards accessible to the actor',
    inputSchema: listBoardsSchema,
  }, async (input) => {
    const boards = deps.useCases.listBoards.execute();
    const actorId = input.actorId;
    if (!actorId) {
      return jsonResult(boards.filter(b => b.visibility === 'public'));
    }
    return jsonResult(boards.filter(b => canAccessBoard(b, actorId)));
  });
}
