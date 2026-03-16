import { describe, it, expect, beforeEach } from 'vitest';
import { createDatabase } from '../../src/infrastructure/persistence/database.js';
import { SqliteEventStore } from '../../src/infrastructure/persistence/sqlite-event-store.js';
import { SqliteCardReadModel } from '../../src/infrastructure/persistence/sqlite-card-read-model.js';
import { SqliteLabelReadModel } from '../../src/infrastructure/persistence/sqlite-label-read-model.js';
import { CardProjection } from '../../src/application/projections/card-projection.js';
import { LabelProjection } from '../../src/application/projections/label-projection.js';
import { CreateCardUseCase } from '../../src/application/use-cases/create-card.js';
import { AddLabelUseCase } from '../../src/application/use-cases/add-label.js';
import type Database from 'better-sqlite3';

const ACTOR = 'user-1';
const BOARD = 'board-1';

describe('AddLabelUseCase', () => {
  let db: Database.Database;
  let createCard: CreateCardUseCase;
  let addLabel: AddLabelUseCase;
  let labelReadModel: SqliteLabelReadModel;

  beforeEach(() => {
    db = createDatabase();
    const eventStore = new SqliteEventStore(db);
    const cardReadModel = new SqliteCardReadModel(db);
    labelReadModel = new SqliteLabelReadModel(db);
    const cardProjection = new CardProjection(cardReadModel);
    const labelProjection = new LabelProjection(labelReadModel);
    createCard = new CreateCardUseCase(
      eventStore,
      cardReadModel,
      cardProjection,
    );
    addLabel = new AddLabelUseCase(
      eventStore,
      cardReadModel,
      labelProjection,
    );
  });

  it('adds a label to a card', () => {
    const { cardId } = createCard.execute({
      title: 'Card',
      actorId: ACTOR,
      boardId: BOARD,
    });

    const result = addLabel.execute({
      cardId,
      label: 'bug',
      color: '#ff0000',
      actorId: ACTOR,
    });

    expect(result.label).toBe('bug');
    expect(result.color).toBe('#ff0000');
  });

  it('persists label to read model', () => {
    const { cardId } = createCard.execute({
      title: 'Card',
      actorId: ACTOR,
      boardId: BOARD,
    });
    addLabel.execute({
      cardId,
      label: 'urgent',
      color: '#ff0000',
      actorId: ACTOR,
    });

    const labels = labelReadModel.findByCard(cardId);
    expect(labels).toHaveLength(1);
    expect(labels[0].label).toBe('urgent');
  });

  it('throws when card not found', () => {
    expect(() =>
      addLabel.execute({
        cardId: '00000000-0000-0000-0000-000000000000',
        label: 'bug',
        color: '#ff0000',
        actorId: ACTOR,
      }),
    ).toThrow('Card not found');
  });
});
