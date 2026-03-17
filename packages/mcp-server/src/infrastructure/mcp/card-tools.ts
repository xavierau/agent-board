import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { McpDeps } from './types.js';
import {
  createCardSchema,
  moveCardSchema,
  updateCardSchema,
  archiveCardSchema,
  listCardsSchema,
  assignCardSchema,
} from './tool-schemas.js';
import {
  jsonResult, validateActor, getActorInfo,
  checkBoardAccess, checkCardBoardAccess,
} from './tool-helpers.js';

export function registerCardTools(
  server: McpServer,
  deps: McpDeps,
): void {
  registerCreateCard(server, deps);
  registerMoveCard(server, deps);
  registerUpdateCard(server, deps);
  registerArchiveCard(server, deps);
  registerListCards(server, deps);
  registerAssignCard(server, deps);
}

function registerCreateCard(
  server: McpServer,
  deps: McpDeps,
): void {
  server.registerTool('create-card', {
    description: 'Create a new kanban card',
    inputSchema: createCardSchema,
  }, async (input) => {
    const err = validateActor(deps.actorValidator, input.actorId);
    if (err) return err;
    const access = checkBoardAccess(deps.boardReadModel, input.boardId, input.actorId);
    if (access) return access;
    const result = deps.useCases.createCard.execute(input);
    const actor = getActorInfo(deps.agentRegistry, input.actorId);
    return jsonResult({ ...result, actor });
  });
}

function registerMoveCard(
  server: McpServer,
  deps: McpDeps,
): void {
  server.registerTool('move-card', {
    description: 'Move a card to a different column',
    inputSchema: moveCardSchema,
  }, async (input) => {
    const err = validateActor(deps.actorValidator, input.actorId);
    if (err) return err;
    const access = checkCardBoardAccess(deps.cardReadModel, deps.boardReadModel, input.cardId, input.actorId);
    if (access) return access;
    const result = deps.useCases.moveCard.execute(input);
    const actor = getActorInfo(deps.agentRegistry, input.actorId);
    return jsonResult({ ...result, actor });
  });
}

function registerUpdateCard(
  server: McpServer,
  deps: McpDeps,
): void {
  server.registerTool('update-card', {
    description: 'Update a card title or description',
    inputSchema: updateCardSchema,
  }, async (input) => {
    const err = validateActor(deps.actorValidator, input.actorId);
    if (err) return err;
    const access = checkCardBoardAccess(deps.cardReadModel, deps.boardReadModel, input.cardId, input.actorId);
    if (access) return access;
    const result = deps.useCases.updateCard.execute(input);
    const actor = getActorInfo(deps.agentRegistry, input.actorId);
    return jsonResult({ ...result, actor });
  });
}

function registerArchiveCard(
  server: McpServer,
  deps: McpDeps,
): void {
  server.registerTool('archive-card', {
    description: 'Archive a kanban card',
    inputSchema: archiveCardSchema,
  }, async (input) => {
    const err = validateActor(deps.actorValidator, input.actorId);
    if (err) return err;
    const access = checkCardBoardAccess(deps.cardReadModel, deps.boardReadModel, input.cardId, input.actorId);
    if (access) return access;
    const result = deps.useCases.archiveCard.execute(input);
    const actor = getActorInfo(deps.agentRegistry, input.actorId);
    return jsonResult({ ...result, actor });
  });
}

function registerListCards(
  server: McpServer,
  { useCases }: McpDeps,
): void {
  server.registerTool('list-cards', {
    description: 'List kanban cards with optional filters',
    inputSchema: listCardsSchema,
  }, async (input) => {
    return jsonResult(useCases.listCards.execute(input));
  });
}

function registerAssignCard(
  server: McpServer,
  deps: McpDeps,
): void {
  server.registerTool('assign-card', {
    description: 'Assign or unassign an agent to a card',
    inputSchema: assignCardSchema,
  }, async (input) => {
    const err = validateActor(deps.actorValidator, input.actorId);
    if (err) return err;
    const access = checkCardBoardAccess(deps.cardReadModel, deps.boardReadModel, input.cardId, input.actorId);
    if (access) return access;
    const result = deps.useCases.assignCard.execute(input);
    const actor = getActorInfo(deps.agentRegistry, input.actorId);
    return jsonResult({ ...result, actor });
  });
}
