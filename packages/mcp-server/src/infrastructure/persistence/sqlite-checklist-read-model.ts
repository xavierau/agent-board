import type Database from 'better-sqlite3';
import type {
  ChecklistReadModel,
  Checklist,
  ChecklistItem,
} from '../../domain/repositories/checklist-read-model.js';

export class SqliteChecklistReadModel implements ChecklistReadModel {
  private readonly createStmt: Database.Statement;
  private readonly removeStmt: Database.Statement;
  private readonly removeItemsByChecklistStmt: Database.Statement;
  private readonly addItemStmt: Database.Statement;
  private readonly updateItemStmt: Database.Statement;
  private readonly toggleItemStmt: Database.Statement;
  private readonly removeItemStmt: Database.Statement;
  private readonly byIdStmt: Database.Statement;
  private readonly itemByIdStmt: Database.Statement;
  private readonly checklistsByCardStmt: Database.Statement;
  private readonly itemsByChecklistStmt: Database.Statement;

  constructor(db: Database.Database) {
    this.createStmt = db.prepare(
      `INSERT INTO checklists (id, card_id, title, position, created_at)
       VALUES (?, ?, ?, ?, ?)`,
    );
    this.removeStmt = db.prepare('DELETE FROM checklists WHERE id = ?');
    this.removeItemsByChecklistStmt = db.prepare(
      'DELETE FROM checklist_items WHERE checklist_id = ?',
    );
    this.addItemStmt = db.prepare(
      `INSERT INTO checklist_items (id, checklist_id, text, completed, position, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    );
    this.updateItemStmt = db.prepare(
      'UPDATE checklist_items SET text = ? WHERE id = ?',
    );
    this.toggleItemStmt = db.prepare(
      'UPDATE checklist_items SET completed = ? WHERE id = ?',
    );
    this.removeItemStmt = db.prepare('DELETE FROM checklist_items WHERE id = ?');
    this.byIdStmt = db.prepare('SELECT * FROM checklists WHERE id = ?');
    this.itemByIdStmt = db.prepare('SELECT * FROM checklist_items WHERE id = ?');
    this.checklistsByCardStmt = db.prepare(
      'SELECT * FROM checklists WHERE card_id = ? ORDER BY position',
    );
    this.itemsByChecklistStmt = db.prepare(
      'SELECT * FROM checklist_items WHERE checklist_id = ? ORDER BY position',
    );
  }

  createChecklist(checklist: Omit<Checklist, 'items'>): void {
    this.createStmt.run(
      checklist.id, checklist.cardId, checklist.title,
      checklist.position, checklist.createdAt,
    );
  }

  removeChecklist(id: string): void {
    this.removeItemsByChecklistStmt.run(id);
    this.removeStmt.run(id);
  }

  addItem(item: ChecklistItem): void {
    this.addItemStmt.run(
      item.id, item.checklistId, item.text,
      item.completed ? 1 : 0, item.position, item.createdAt,
    );
  }

  updateItem(id: string, text: string): void {
    this.updateItemStmt.run(text, id);
  }

  toggleItem(id: string, completed: boolean): void {
    this.toggleItemStmt.run(completed ? 1 : 0, id);
  }

  removeItem(id: string): void {
    this.removeItemStmt.run(id);
  }

  findChecklistById(id: string): Omit<Checklist, 'items'> | null {
    const row = this.byIdStmt.get(id) as ChecklistRow | undefined;
    return row ? toChecklist(row) : null;
  }

  findItemById(id: string): ChecklistItem | null {
    const row = this.itemByIdStmt.get(id) as ItemRow | undefined;
    return row ? toItem(row) : null;
  }

  findByCard(cardId: string): Checklist[] {
    const rows = this.checklistsByCardStmt.all(cardId) as ChecklistRow[];
    return rows.map((row) => ({
      ...toChecklist(row),
      items: this.getItems(row.id),
    }));
  }

  private getItems(checklistId: string): ChecklistItem[] {
    const rows = this.itemsByChecklistStmt.all(checklistId) as ItemRow[];
    return rows.map(toItem);
  }
}

type ChecklistRow = {
  id: string;
  card_id: string;
  title: string;
  position: number;
  created_at: string;
};

type ItemRow = {
  id: string;
  checklist_id: string;
  text: string;
  completed: number;
  position: number;
  created_at: string;
};

function toChecklist(row: ChecklistRow): Omit<Checklist, 'items'> {
  return {
    id: row.id,
    cardId: row.card_id,
    title: row.title,
    position: row.position,
    createdAt: row.created_at,
  };
}

function toItem(row: ItemRow): ChecklistItem {
  return {
    id: row.id,
    checklistId: row.checklist_id,
    text: row.text,
    completed: row.completed === 1,
    position: row.position,
    createdAt: row.created_at,
  };
}
