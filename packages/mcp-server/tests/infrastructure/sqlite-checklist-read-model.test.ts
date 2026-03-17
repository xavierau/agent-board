import { describe, it, expect, beforeEach } from 'vitest';
import { createDatabase } from '../../src/infrastructure/persistence/database.js';
import { SqliteChecklistReadModel } from '../../src/infrastructure/persistence/sqlite-checklist-read-model.js';
import type { Checklist, ChecklistItem } from '../../src/domain/repositories/checklist-read-model.js';
import type Database from 'better-sqlite3';

describe('SqliteChecklistReadModel', () => {
  let db: Database.Database;
  let model: SqliteChecklistReadModel;

  const checklist: Omit<Checklist, 'items'> = {
    id: 'cl-1',
    cardId: 'card-1',
    title: 'Todo List',
    position: 0,
    createdAt: '2026-01-01T00:00:00.000Z',
  };

  const item: ChecklistItem = {
    id: 'item-1',
    checklistId: 'cl-1',
    text: 'Buy milk',
    completed: false,
    position: 0,
    createdAt: '2026-01-01T00:00:00.000Z',
  };

  beforeEach(() => {
    db = createDatabase();
    model = new SqliteChecklistReadModel(db);
  });

  it('creates and finds checklist by id', () => {
    model.createChecklist(checklist);
    const found = model.findChecklistById('cl-1');
    expect(found).toEqual(checklist);
  });

  it('returns null for unknown checklist id', () => {
    expect(model.findChecklistById('nonexistent')).toBeNull();
  });

  it('removes a checklist', () => {
    model.createChecklist(checklist);
    model.removeChecklist('cl-1');
    expect(model.findChecklistById('cl-1')).toBeNull();
  });

  it('adds and finds item by id', () => {
    model.createChecklist(checklist);
    model.addItem(item);
    const found = model.findItemById('item-1');
    expect(found).toEqual(item);
  });

  it('returns null for unknown item id', () => {
    expect(model.findItemById('nonexistent')).toBeNull();
  });

  it('updates item text', () => {
    model.createChecklist(checklist);
    model.addItem(item);
    model.updateItem('item-1', 'Buy eggs');
    expect(model.findItemById('item-1')?.text).toBe('Buy eggs');
  });

  it('toggles item completed', () => {
    model.createChecklist(checklist);
    model.addItem(item);
    model.toggleItem('item-1', true);
    expect(model.findItemById('item-1')?.completed).toBe(true);
  });

  it('removes an item', () => {
    model.createChecklist(checklist);
    model.addItem(item);
    model.removeItem('item-1');
    expect(model.findItemById('item-1')).toBeNull();
  });

  it('findByCard returns checklists with items ordered by position', () => {
    model.createChecklist(checklist);
    model.createChecklist({ ...checklist, id: 'cl-2', title: 'Done', position: 1 });
    model.addItem(item);
    model.addItem({ ...item, id: 'item-2', text: 'Buy eggs', position: 1 });
    model.addItem({ ...item, id: 'item-3', checklistId: 'cl-2', text: 'Ship it', position: 0 });

    const results = model.findByCard('card-1');
    expect(results).toHaveLength(2);
    expect(results[0].title).toBe('Todo List');
    expect(results[0].items).toHaveLength(2);
    expect(results[0].items[0].text).toBe('Buy milk');
    expect(results[0].items[1].text).toBe('Buy eggs');
    expect(results[1].title).toBe('Done');
    expect(results[1].items).toHaveLength(1);
  });

  it('findByCard returns empty array for unknown card', () => {
    expect(model.findByCard('nonexistent')).toEqual([]);
  });

  it('removeChecklist also removes its items', () => {
    model.createChecklist(checklist);
    model.addItem(item);
    model.removeChecklist('cl-1');
    expect(model.findItemById('item-1')).toBeNull();
  });
});
