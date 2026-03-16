import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import { join } from 'node:path';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { JsonlStore } from '../../db/jsonl-store.js';
import { createTodoRouter } from '../todos.js';

function buildApp(store: JsonlStore): express.Express {
  const app = express();
  app.use(express.json());
  app.use('/api/todos', createTodoRouter(store));
  return app;
}

describe('Todo Routes', () => {
  let tmpDir: string;
  let store: JsonlStore;
  let app: express.Express;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'todo-test-'));
    store = new JsonlStore(join(tmpDir, 'todos.jsonl'));
    app = buildApp(store);
  });

  afterAll(() => {
    if (tmpDir) rmSync(tmpDir, { recursive: true, force: true });
  });

  describe('GET /api/todos', () => {
    it('returns empty array when no todos', async () => {
      const res = await request(app).get('/api/todos');
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it('returns all todos', async () => {
      store.create({ title: 'First' });
      store.create({ title: 'Second' });
      const res = await request(app).get('/api/todos');
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      expect(res.body[0].title).toBe('First');
      expect(res.body[1].title).toBe('Second');
    });
  });

  describe('POST /api/todos', () => {
    it('creates a todo with valid title', async () => {
      const res = await request(app)
        .post('/api/todos')
        .send({ title: 'Buy milk' });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({ title: 'Buy milk', completed: false });
      expect(res.body.id).toBeDefined();
    });

    it('returns 400 when title is missing', async () => {
      const res = await request(app).post('/api/todos').send({});
      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it('returns 400 when title is empty string', async () => {
      const res = await request(app).post('/api/todos').send({ title: '' });
      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it('returns 400 when title is not a string', async () => {
      const res = await request(app).post('/api/todos').send({ title: 123 });
      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });
  });

  describe('PATCH /api/todos/:id', () => {
    it('updates title of existing todo', async () => {
      const todo = store.create({ title: 'Old title' });
      const res = await request(app)
        .patch(`/api/todos/${todo.id}`)
        .send({ title: 'New title' });

      expect(res.status).toBe(200);
      expect(res.body.title).toBe('New title');
    });

    it('updates completed status', async () => {
      const todo = store.create({ title: 'Task' });
      const res = await request(app)
        .patch(`/api/todos/${todo.id}`)
        .send({ completed: true });

      expect(res.status).toBe(200);
      expect(res.body.completed).toBe(true);
    });

    it('returns 404 for non-existent todo', async () => {
      const res = await request(app)
        .patch('/api/todos/non-existent-id')
        .send({ title: 'Updated' });

      expect(res.status).toBe(404);
      expect(res.body.error).toBeDefined();
    });

    it('returns 400 when body has no valid fields', async () => {
      const todo = store.create({ title: 'Task' });
      const res = await request(app)
        .patch(`/api/todos/${todo.id}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });
  });

  describe('DELETE /api/todos/:id', () => {
    it('deletes an existing todo', async () => {
      const todo = store.create({ title: 'To delete' });
      const res = await request(app)
        .delete(`/api/todos/${todo.id}`);

      expect(res.status).toBe(204);
      expect(store.getAll()).toHaveLength(0);
    });

    it('returns 404 for non-existent todo', async () => {
      const res = await request(app)
        .delete('/api/todos/non-existent-id');

      expect(res.status).toBe(404);
      expect(res.body.error).toBeDefined();
    });
  });
});
