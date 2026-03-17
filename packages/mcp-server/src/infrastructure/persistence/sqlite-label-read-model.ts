import type Database from 'better-sqlite3';
import type { LabelReadModel } from '../../domain/repositories/label-read-model.js';

export class SqliteLabelReadModel implements LabelReadModel {
  private readonly upsertStmt: Database.Statement;
  private readonly removeStmt: Database.Statement;
  private readonly removeAllStmt: Database.Statement;
  private readonly byCardStmt: Database.Statement;

  constructor(db: Database.Database) {
    this.upsertStmt = db.prepare(
      `INSERT OR REPLACE INTO card_labels (card_id, label, color, added_at)
       VALUES (?, ?, ?, ?)`,
    );
    this.removeStmt = db.prepare(
      'DELETE FROM card_labels WHERE card_id = ? AND label = ?',
    );
    this.removeAllStmt = db.prepare(
      'DELETE FROM card_labels WHERE label = ?',
    );
    this.byCardStmt = db.prepare(
      'SELECT label, color FROM card_labels WHERE card_id = ? ORDER BY label',
    );
  }

  addLabel(
    cardId: string,
    label: string,
    color: string,
    addedAt: string,
  ): void {
    this.upsertStmt.run(cardId, label, color, addedAt);
  }

  removeLabel(cardId: string, label: string): void {
    this.removeStmt.run(cardId, label);
  }

  removeLabelFromAllCards(label: string): void {
    this.removeAllStmt.run(label);
  }

  findByCard(cardId: string): Array<{ label: string; color: string }> {
    return this.byCardStmt.all(cardId) as Array<{
      label: string;
      color: string;
    }>;
  }
}
