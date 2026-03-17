import type {
  ChecklistCreated,
  ChecklistRemoved,
  ChecklistItemAdded,
  ChecklistItemToggled,
  ChecklistItemUpdated,
  ChecklistItemRemoved,
} from './checklist-events.js';

type BaseParams = {
  readonly streamId: string;
  readonly actorId: string;
  readonly version: number;
};

type CreateChecklistParams = BaseParams & {
  readonly checklistId: string;
  readonly title: string;
  readonly position: number;
};

export function createChecklistCreatedEvent(
  p: CreateChecklistParams,
): ChecklistCreated {
  return {
    type: 'ChecklistCreated',
    streamId: p.streamId,
    version: p.version,
    actorId: p.actorId,
    payload: { checklistId: p.checklistId, title: p.title, position: p.position },
    occurredAt: new Date().toISOString(),
  };
}

type RemoveChecklistParams = BaseParams & { readonly checklistId: string };

export function createChecklistRemovedEvent(
  p: RemoveChecklistParams,
): ChecklistRemoved {
  return {
    type: 'ChecklistRemoved',
    streamId: p.streamId,
    version: p.version,
    actorId: p.actorId,
    payload: { checklistId: p.checklistId },
    occurredAt: new Date().toISOString(),
  };
}

type AddItemParams = BaseParams & {
  readonly checklistId: string;
  readonly itemId: string;
  readonly text: string;
  readonly position: number;
};

export function createChecklistItemAddedEvent(
  p: AddItemParams,
): ChecklistItemAdded {
  return {
    type: 'ChecklistItemAdded',
    streamId: p.streamId,
    version: p.version,
    actorId: p.actorId,
    payload: { checklistId: p.checklistId, itemId: p.itemId, text: p.text, position: p.position },
    occurredAt: new Date().toISOString(),
  };
}

type ToggleItemParams = BaseParams & {
  readonly checklistId: string;
  readonly itemId: string;
  readonly completed: boolean;
};

export function createChecklistItemToggledEvent(
  p: ToggleItemParams,
): ChecklistItemToggled {
  return {
    type: 'ChecklistItemToggled',
    streamId: p.streamId,
    version: p.version,
    actorId: p.actorId,
    payload: { checklistId: p.checklistId, itemId: p.itemId, completed: p.completed },
    occurredAt: new Date().toISOString(),
  };
}

type UpdateItemParams = BaseParams & {
  readonly checklistId: string;
  readonly itemId: string;
  readonly text: string;
};

export function createChecklistItemUpdatedEvent(
  p: UpdateItemParams,
): ChecklistItemUpdated {
  return {
    type: 'ChecklistItemUpdated',
    streamId: p.streamId,
    version: p.version,
    actorId: p.actorId,
    payload: { checklistId: p.checklistId, itemId: p.itemId, text: p.text },
    occurredAt: new Date().toISOString(),
  };
}

type RemoveItemParams = BaseParams & {
  readonly checklistId: string;
  readonly itemId: string;
};

export function createChecklistItemRemovedEvent(
  p: RemoveItemParams,
): ChecklistItemRemoved {
  return {
    type: 'ChecklistItemRemoved',
    streamId: p.streamId,
    version: p.version,
    actorId: p.actorId,
    payload: { checklistId: p.checklistId, itemId: p.itemId },
    occurredAt: new Date().toISOString(),
  };
}
