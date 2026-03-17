export type ChecklistCreated = {
  readonly type: 'ChecklistCreated';
  readonly streamId: string;
  readonly version: number;
  readonly actorId: string;
  readonly payload: {
    readonly checklistId: string;
    readonly title: string;
    readonly position: number;
  };
  readonly occurredAt: string;
};

export type ChecklistRemoved = {
  readonly type: 'ChecklistRemoved';
  readonly streamId: string;
  readonly version: number;
  readonly actorId: string;
  readonly payload: { readonly checklistId: string };
  readonly occurredAt: string;
};

export type ChecklistItemAdded = {
  readonly type: 'ChecklistItemAdded';
  readonly streamId: string;
  readonly version: number;
  readonly actorId: string;
  readonly payload: {
    readonly checklistId: string;
    readonly itemId: string;
    readonly text: string;
    readonly position: number;
  };
  readonly occurredAt: string;
};

export type ChecklistItemToggled = {
  readonly type: 'ChecklistItemToggled';
  readonly streamId: string;
  readonly version: number;
  readonly actorId: string;
  readonly payload: {
    readonly checklistId: string;
    readonly itemId: string;
    readonly completed: boolean;
  };
  readonly occurredAt: string;
};

export type ChecklistItemUpdated = {
  readonly type: 'ChecklistItemUpdated';
  readonly streamId: string;
  readonly version: number;
  readonly actorId: string;
  readonly payload: {
    readonly checklistId: string;
    readonly itemId: string;
    readonly text: string;
  };
  readonly occurredAt: string;
};

export type ChecklistItemRemoved = {
  readonly type: 'ChecklistItemRemoved';
  readonly streamId: string;
  readonly version: number;
  readonly actorId: string;
  readonly payload: {
    readonly checklistId: string;
    readonly itemId: string;
  };
  readonly occurredAt: string;
};

export type ChecklistEvent =
  | ChecklistCreated
  | ChecklistRemoved
  | ChecklistItemAdded
  | ChecklistItemToggled
  | ChecklistItemUpdated
  | ChecklistItemRemoved;
