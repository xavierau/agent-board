import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { McpDeps } from './types.js';
import { registerBoardTools } from './board-tools.js';
import { registerCardTools } from './card-tools.js';
import { registerLabelTools } from './label-tools.js';
import { registerCommentTools } from './comment-tools.js';
import { registerAgentTools } from './agent-tools.js';

export type { McpDeps, UseCases } from './types.js';

export function createMcpServer(deps: McpDeps): McpServer {
  const server = new McpServer({
    name: 'my-trello-kanban',
    version: '0.1.0',
  });

  registerBoardTools(server, deps);
  registerCardTools(server, deps);
  registerLabelTools(server, deps);
  registerCommentTools(server, deps);
  registerAgentTools(server, deps);

  return server;
}
