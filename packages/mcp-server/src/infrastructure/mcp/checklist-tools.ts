import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { McpDeps } from './types.js';
import {
  createChecklistSchema,
  removeChecklistSchema,
  addChecklistItemSchema,
  listChecklistsSchema,
} from './checklist-schemas.js';
import { jsonResult, validateActor, getActorInfo, checkCardBoardAccess } from './tool-helpers.js';

export function registerChecklistTools(
  server: McpServer,
  deps: McpDeps,
): void {
  registerCreate(server, deps);
  registerRemove(server, deps);
  registerAddItem(server, deps);
  registerList(server, deps);
}

function registerCreate(server: McpServer, deps: McpDeps): void {
  server.registerTool('create-checklist', {
    description: 'Create a checklist on a card',
    inputSchema: createChecklistSchema,
  }, async (input) => {
    const err = validateActor(deps.actorValidator, input.actorId);
    if (err) return err;
    const access = checkCardBoardAccess(deps.cardReadModel, deps.boardReadModel, input.cardId, input.actorId);
    if (access) return access;
    const result = deps.useCases.createChecklist.execute(input);
    const actor = getActorInfo(deps.agentRegistry, input.actorId);
    return jsonResult({ ...result, actor });
  });
}

function registerRemove(server: McpServer, deps: McpDeps): void {
  server.registerTool('remove-checklist', {
    description: 'Remove a checklist and all its items',
    inputSchema: removeChecklistSchema,
  }, async (input) => {
    const err = validateActor(deps.actorValidator, input.actorId);
    if (err) return err;
    const result = deps.useCases.removeChecklist.execute(input);
    const actor = getActorInfo(deps.agentRegistry, input.actorId);
    return jsonResult({ ...result, actor });
  });
}

function registerAddItem(server: McpServer, deps: McpDeps): void {
  server.registerTool('add-checklist-item', {
    description: 'Add an item to a checklist',
    inputSchema: addChecklistItemSchema,
  }, async (input) => {
    const err = validateActor(deps.actorValidator, input.actorId);
    if (err) return err;
    const result = deps.useCases.addChecklistItem.execute(input);
    const actor = getActorInfo(deps.agentRegistry, input.actorId);
    return jsonResult({ ...result, actor });
  });
}

function registerList(server: McpServer, deps: McpDeps): void {
  server.registerTool('list-checklists', {
    description: 'List all checklists and items for a card with progress',
    inputSchema: listChecklistsSchema,
  }, async (input) => {
    const checklists = deps.useCases.listChecklists.execute(input.cardId);
    const withProgress = checklists.map(addProgress);
    return jsonResult({ checklists: withProgress });
  });
}

function addProgress(checklist: { items: readonly { completed: boolean }[] }) {
  const total = checklist.items.length;
  const done = checklist.items.filter((i) => i.completed).length;
  return { ...checklist, progress: { done, total } };
}
