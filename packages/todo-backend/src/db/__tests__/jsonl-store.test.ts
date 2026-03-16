import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { JsonlStore } from '../jsonl-store.js';

describe('JsonlStore', () => {
  let tempDir: string;
  let filePath: string;
  let store: JsonlStore;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'jsonl-test-'));
    filePath = join(tempDir, 'data', 'todos.jsonl');
    store = new JsonlStore(filePath);
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('returns empty array when file does not exist', () => {
    expect(store.getAll()).toEqual([]);
  });

  it('creates a todo and retrieves it', () => {
    const todo = store.create({ title: 'Buy milk' });

    expect(todo.title).toBe('Buy milk');
    expect(todo.completed).toBe(false);
    expect(todo.id).toBeTruthy();
    expect(todo.createdAt).toBeTruthy();
    expect(todo.updatedAt).toBe(todo.createdAt);
  });

  it('retrieves all created todos', () => {
    store.create({ title: 'First' });
    store.create({ title: 'Second' });

    const todos = store.getAll();
    expect(todos).toHaveLength(2);
    expect(todos[0].title).toBe('First');
    expect(todos[1].title).toBe('Second');
  });

  it('finds a todo by id', () => {
    const created = store.create({ title: 'Find me' });

    const found = store.getById(created.id);
    expect(found).toEqual(created);
  });

  it('returns undefined for nonexistent id', () => {
    expect(store.getById('no-such-id')).toBeUndefined();
  });

  it('updates a todo title and completed status', () => {
    const created = store.create({ title: 'Original' });

    const updated = store.update(created.id, {
      title: 'Changed',
      completed: true,
    });

    expect(updated.title).toBe('Changed');
    expect(updated.completed).toBe(true);
    expect(updated.id).toBe(created.id);
    expect(updated.createdAt).toBe(created.createdAt);
    expect(updated.updatedAt).not.toBe(created.updatedAt);
  });

  it('throws when updating a nonexistent todo', () => {
    expect(() => store.update('missing', { title: 'X' })).toThrow();
  });

  it('deletes a todo and returns true', () => {
    const created = store.create({ title: 'Delete me' });

    expect(store.delete(created.id)).toBe(true);
    expect(store.getAll()).toHaveLength(0);
  });

  it('returns false when deleting nonexistent todo', () => {
    expect(store.delete('nope')).toBe(false);
  });
});
