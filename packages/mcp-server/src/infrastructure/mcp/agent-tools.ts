import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { McpDeps } from './types.js';
import { listAgentsSchema } from './tool-schemas.js';
import { jsonResult } from './tool-helpers.js';

export function registerAgentTools(
  server: McpServer,
  deps: McpDeps,
): void {
  server.registerTool('list-agents', {
    description: 'List all registered agents in the org',
    inputSchema: listAgentsSchema,
  }, async () => {
    const agents = deps.agentRegistry.getAllAgents();
    return jsonResult(agents.map(formatAgent));
  });
}

function formatAgent(a: { id: string; display_name: string; role_type: string; identity: { email: string } }) {
  return { id: a.id, display_name: a.display_name, role_type: a.role_type, email: a.identity.email };
}
