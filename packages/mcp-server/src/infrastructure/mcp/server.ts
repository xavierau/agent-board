import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { McpDeps } from './types.js';
import { registerBoardTools } from './board-tools.js';
import { registerCardTools } from './card-tools.js';
import { registerLabelTools } from './label-tools.js';
import { registerCommentTools } from './comment-tools.js';
import { registerAgentTools } from './agent-tools.js';
import { registerBoardAccessTools } from './board-access-tools.js';
import { registerBoardLabelTools } from './board-label-tools.js';
import { registerChecklistTools } from './checklist-tools.js';
import { registerChecklistItemTools } from './checklist-item-tools.js';
import { registerEventTools } from './event-tools.js';

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
  registerBoardAccessTools(server, deps);
  registerBoardLabelTools(server, deps);
  registerChecklistTools(server, deps);
  registerChecklistItemTools(server, deps);
  registerEventTools(server, deps);

  return server;
}
