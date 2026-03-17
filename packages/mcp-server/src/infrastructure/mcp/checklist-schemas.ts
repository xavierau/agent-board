import { z } from 'zod';

export const createChecklistSchema = z.object({
  cardId: z.string().uuid(),
  title: z.string().min(1).max(200),
  actorId: z.string().min(1),
});

export const removeChecklistSchema = z.object({
  checklistId: z.string().uuid(),
  actorId: z.string().min(1),
});

export const addChecklistItemSchema = z.object({
  checklistId: z.string().uuid(),
  text: z.string().min(1).max(500),
  actorId: z.string().min(1),
});

export const toggleChecklistItemSchema = z.object({
  itemId: z.string().uuid(),
  completed: z.boolean(),
  actorId: z.string().min(1),
});

export const updateChecklistItemSchema = z.object({
  itemId: z.string().uuid(),
  text: z.string().min(1).max(500),
  actorId: z.string().min(1),
});

export const removeChecklistItemSchema = z.object({
  itemId: z.string().uuid(),
  actorId: z.string().min(1),
});

export const listChecklistsSchema = z.object({
  cardId: z.string().uuid(),
});
