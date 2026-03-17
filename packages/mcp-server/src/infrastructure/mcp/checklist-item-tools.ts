import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { McpDeps } from './types.js';
import {
  toggleChecklistItemSchema,
  updateChecklistItemSchema,
  removeChecklistItemSchema,
} from './checklist-schemas.js';
import { jsonResult, validateActor, getActorInfo } from './tool-helpers.js';

export function registerChecklistItemTools(
  server: McpServer,
  deps: McpDeps,
): void {
  registerToggle(server, deps);
  registerUpdate(server, deps);
  registerRemove(server, deps);
}

function registerToggle(server: McpServer, deps: McpDeps): void {
  server.registerTool('toggle-checklist-item', {
    description: 'Toggle a checklist item completed/incomplete',
    inputSchema: toggleChecklistItemSchema,
  }, async (input) => {
    const err = validateActor(deps.actorValidator, input.actorId);
    if (err) return err;
    const result = deps.useCases.toggleChecklistItem.execute(input);
    const actor = getActorInfo(deps.agentRegistry, input.actorId);
    return jsonResult({ ...result, actor });
  });
}

function registerUpdate(server: McpServer, deps: McpDeps): void {
  server.registerTool('update-checklist-item', {
    description: 'Update a checklist item\'s text',
    inputSchema: updateChecklistItemSchema,
  }, async (input) => {
    const err = validateActor(deps.actorValidator, input.actorId);
    if (err) return err;
    const result = deps.useCases.updateChecklistItem.execute(input);
    const actor = getActorInfo(deps.agentRegistry, input.actorId);
    return jsonResult({ ...result, actor });
  });
}

function registerRemove(server: McpServer, deps: McpDeps): void {
  server.registerTool('remove-checklist-item', {
    description: 'Remove a checklist item',
    inputSchema: removeChecklistItemSchema,
  }, async (input) => {
    const err = validateActor(deps.actorValidator, input.actorId);
    if (err) return err;
    const result = deps.useCases.removeChecklistItem.execute(input);
    const actor = getActorInfo(deps.agentRegistry, input.actorId);
    return jsonResult({ ...result, actor });
  });
}
