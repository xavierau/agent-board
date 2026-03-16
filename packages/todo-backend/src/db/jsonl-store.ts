import {
  readFileSync,
  writeFileSync,
  appendFileSync,
  existsSync,
  mkdirSync,
} from 'node:fs';
import { dirname } from 'node:path';
import { randomUUID } from 'node:crypto';
import type { Todo, CreateTodoInput, UpdateTodoInput } from '../types.js';

export class JsonlStore {
  private readonly filePath: string;

  constructor(filePath: string) {
    this.filePath = filePath;
    mkdirSync(dirname(filePath), { recursive: true });
  }

  getAll(): Todo[] {
    if (!existsSync(this.filePath)) return [];
    const content = readFileSync(this.filePath, 'utf-8');
    return this.parseLines(content);
  }

  getById(id: string): Todo | undefined {
    return this.getAll().find((t) => t.id === id);
  }

  create(input: CreateTodoInput): Todo {
    const now = new Date().toISOString();
    const todo: Todo = {
      id: randomUUID(),
      title: input.title,
      completed: false,
      createdAt: now,
      updatedAt: now,
    };
    appendFileSync(this.filePath, JSON.stringify(todo) + '\n');
    return todo;
  }

  update(id: string, input: UpdateTodoInput): Todo {
    const todos = this.getAll();
    const index = todos.findIndex((t) => t.id === id);
    if (index === -1) throw new Error(`Todo not found: ${id}`);

    const existing = todos[index];
    const updated: Todo = {
      ...existing,
      title: input.title ?? existing.title,
      completed: input.completed ?? existing.completed,
      updatedAt: new Date().toISOString(),
    };
    todos[index] = updated;
    this.writeAll(todos);
    return updated;
  }

  delete(id: string): boolean {
    const todos = this.getAll();
    const filtered = todos.filter((t) => t.id !== id);
    if (filtered.length === todos.length) return false;
    this.writeAll(filtered);
    return true;
  }

  private parseLines(content: string): Todo[] {
    return content
      .split('\n')
      .filter((line) => line.trim() !== '')
      .map((line) => JSON.parse(line) as Todo);
  }

  private writeAll(todos: Todo[]): void {
    const content = todos.map((t) => JSON.stringify(t)).join('\n');
    writeFileSync(this.filePath, content ? content + '\n' : '');
  }
}
