import { describe, it, expect, beforeEach } from 'vitest';
import { createDatabase } from '../../src/infrastructure/persistence/database.js';
import { SqliteLabelReadModel } from '../../src/infrastructure/persistence/sqlite-label-read-model.js';
import type Database from 'better-sqlite3';

describe('SqliteLabelReadModel', () => {
  let db: Database.Database;
  let model: SqliteLabelReadModel;

  beforeEach(() => {
    db = createDatabase();
    model = new SqliteLabelReadModel(db);
  });

  it('adds a label and finds by card', () => {
    model.addLabel('card-1', 'bug', '#ff0000', '2026-01-01T00:00:00.000Z');

    const labels = model.findByCard('card-1');
    expect(labels).toEqual([{ label: 'bug', color: '#ff0000' }]);
  });

  it('returns empty array for card with no labels', () => {
    expect(model.findByCard('card-1')).toEqual([]);
  });

  it('adds multiple labels to same card', () => {
    model.addLabel('card-1', 'bug', '#ff0000', '2026-01-01T00:00:00.000Z');
    model.addLabel('card-1', 'urgent', '#ff8800', '2026-01-01T00:00:00.000Z');

    const labels = model.findByCard('card-1');
    expect(labels).toHaveLength(2);
  });

  it('removes a label', () => {
    model.addLabel('card-1', 'bug', '#ff0000', '2026-01-01T00:00:00.000Z');
    model.addLabel('card-1', 'urgent', '#ff8800', '2026-01-01T00:00:00.000Z');
    model.removeLabel('card-1', 'bug');

    const labels = model.findByCard('card-1');
    expect(labels).toEqual([{ label: 'urgent', color: '#ff8800' }]);
  });

  it('removing nonexistent label is a no-op', () => {
    model.removeLabel('card-1', 'nonexistent');
    expect(model.findByCard('card-1')).toEqual([]);
  });

  it('does not mix labels between cards', () => {
    model.addLabel('card-1', 'bug', '#ff0000', '2026-01-01T00:00:00.000Z');
    model.addLabel('card-2', 'feature', '#00ff00', '2026-01-01T00:00:00.000Z');

    expect(model.findByCard('card-1')).toEqual([{ label: 'bug', color: '#ff0000' }]);
    expect(model.findByCard('card-2')).toEqual([{ label: 'feature', color: '#00ff00' }]);
  });

  it('upserts on duplicate card+label', () => {
    model.addLabel('card-1', 'bug', '#ff0000', '2026-01-01T00:00:00.000Z');
    model.addLabel('card-1', 'bug', '#cc0000', '2026-01-02T00:00:00.000Z');

    const labels = model.findByCard('card-1');
    expect(labels).toHaveLength(1);
    expect(labels[0].color).toBe('#cc0000');
  });
});
