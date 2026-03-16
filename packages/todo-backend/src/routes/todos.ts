import { Router, type Request, type Response } from 'express';
import type { JsonlStore } from '../db/jsonl-store.js';

function isValidTitle(title: unknown): title is string {
  return typeof title === 'string' && title.trim().length > 0;
}

function hasValidUpdateFields(body: unknown): boolean {
  if (!body || typeof body !== 'object') return false;
  const b = body as Record<string, unknown>;
  return isValidTitle(b.title) || typeof b.completed === 'boolean';
}

function handleGetAll(store: JsonlStore) {
  return (_req: Request, res: Response) => {
    res.json(store.getAll());
  };
}

function handleCreate(store: JsonlStore) {
  return (req: Request, res: Response) => {
    if (!isValidTitle(req.body?.title)) {
      res.status(400).json({ error: 'Title is required (non-empty string)' });
      return;
    }
    const todo = store.create({ title: req.body.title.trim() });
    res.status(201).json(todo);
  };
}

function handleUpdate(store: JsonlStore) {
  return (req: Request, res: Response) => {
    if (!hasValidUpdateFields(req.body)) {
      res.status(400).json({ error: 'Provide title (string) or completed (boolean)' });
      return;
    }
    try {
      const todo = store.update(req.params.id, req.body);
      res.json(todo);
    } catch {
      res.status(404).json({ error: 'Todo not found' });
    }
  };
}

function handleDelete(store: JsonlStore) {
  return (req: Request, res: Response) => {
    const deleted = store.delete(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: 'Todo not found' });
      return;
    }
    res.status(204).send();
  };
}

export function createTodoRouter(store: JsonlStore): Router {
  const router = Router();
  router.get('/', handleGetAll(store));
  router.post('/', handleCreate(store));
  router.patch('/:id', handleUpdate(store));
  router.delete('/:id', handleDelete(store));
  return router;
}
