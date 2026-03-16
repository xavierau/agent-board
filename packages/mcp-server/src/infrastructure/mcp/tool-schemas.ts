import { z } from 'zod';

// Board tools
export const createBoardSchema = z.object({
  name: z.string().min(1).max(100),
  columns: z.array(z.string().min(1)).optional(),
  actorId: z.string().min(1),
});

export const listBoardsSchema = z.object({});

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
