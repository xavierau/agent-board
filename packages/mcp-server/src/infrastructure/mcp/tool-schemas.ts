import { z } from 'zod';

// Board tools
export const createBoardSchema = z.object({
  name: z.string().min(1).max(100),
  columns: z.array(z.string().min(1)).optional(),
  actorId: z.string().min(1),
});

export const listBoardsSchema = z.object({
  actorId: z.string().min(1).optional(),
});

// Board access tools
export const setBoardVisibilitySchema = z.object({
  boardId: z.string().uuid(),
  visibility: z.enum(['public', 'private']),
  actorId: z.string().min(1),
});

export const transferBoardOwnershipSchema = z.object({
  boardId: z.string().uuid(),
  newOwnerId: z.string().min(1),
  actorId: z.string().min(1),
});

export const addBoardMemberSchema = z.object({
  boardId: z.string().uuid(),
  memberId: z.string().min(1),
  actorId: z.string().min(1),
});

export const removeBoardMemberSchema = z.object({
  boardId: z.string().uuid(),
  memberId: z.string().min(1),
  actorId: z.string().min(1),
});

// Card tools
export const createCardSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).default(''),
  column: z.string().min(1).default('todo'),
  boardId: z.string().uuid(),
  actorId: z.string().min(1),
});

export const moveCardSchema = z.object({
  cardId: z.string().uuid(),
  toColumn: z.string().min(1),
  position: z.number().int().nonnegative().default(0),
  actorId: z.string().min(1),
});

export const updateCardSchema = z.object({
  cardId: z.string().uuid(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  actorId: z.string().min(1),
});

export const archiveCardSchema = z.object({
  cardId: z.string().uuid(),
  actorId: z.string().min(1),
});

export const listCardsSchema = z.object({
  column: z.string().optional(),
  boardId: z.string().uuid().optional(),
  page: z.number().int().positive().optional(),
  pageSize: z.number().int().positive().max(100).optional(),
});

export const assignCardSchema = z.object({
  cardId: z.string().uuid(),
  assigneeId: z.string().nullable(),
  actorId: z.string().min(1),
});

// Label tools
export const addLabelSchema = z.object({
  cardId: z.string().uuid(),
  label: z.string().min(1).max(50),
  color: z.string().min(1).max(20).default('#888888'),
  actorId: z.string().min(1),
});

export const removeLabelSchema = z.object({
  cardId: z.string().uuid(),
  label: z.string().min(1).max(50),
  actorId: z.string().min(1),
});

// Board label tools
export const createBoardLabelSchema = z.object({
  boardId: z.string().uuid(),
  name: z.string().min(1).max(50),
  color: z.string().min(1).max(20).default('#888888'),
  actorId: z.string().min(1),
});

export const updateBoardLabelSchema = z.object({
  labelId: z.string().uuid(),
  name: z.string().min(1).max(50),
  color: z.string().min(1).max(20),
  actorId: z.string().min(1),
});

export const removeBoardLabelSchema = z.object({
  labelId: z.string().uuid(),
  actorId: z.string().min(1),
});

export const listBoardLabelsSchema = z.object({
  boardId: z.string().uuid(),
});

// Agent tools
export const listAgentsSchema = z.object({});

// Comment tools
export const addCommentSchema = z.object({
  cardId: z.string().uuid(),
  text: z.string().min(1).max(5000),
  actorId: z.string().min(1),
  parentCommentId: z.string().uuid().optional(),
});

export const listCommentsSchema = z.object({
  cardId: z.string().uuid(),
});

// Event tools
export const listEventsSchema = z.object({
  sinceId: z.number().int().nonnegative().default(0),
  limit: z.number().int().positive().max(1000).default(100),
});
