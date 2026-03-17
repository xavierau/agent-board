import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { McpDeps } from './types.js';
import { listEventsSchema } from './tool-schemas.js';
import { jsonResult } from './tool-helpers.js';

export function registerEventTools(
  server: McpServer,
  deps: McpDeps,
): void {
  server.registerTool('list-events', {
    description: 'List domain events as a cursor-based feed. Use sinceId to poll for new events.',
    inputSchema: listEventsSchema,
  }, async (input) => {
    const events = deps.useCases.listEvents.execute(input);
    return jsonResult(events);
  });
}
