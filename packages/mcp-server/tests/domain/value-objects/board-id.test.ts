import { describe, it, expect } from 'vitest';
import { BoardId } from '../../../src/domain/value-objects/board-id.js';

describe('BoardId', () => {
  it('generates a valid UUID', () => {
    const id = BoardId.generate();
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    expect(uuidRegex.test(id.toString())).toBe(true);
  });

  it('generates unique ids', () => {
    const a = BoardId.generate();
    const b = BoardId.generate();

    expect(a.toString()).not.toBe(b.toString());
  });

  it('creates from a valid UUID string', () => {
    const uuid = '550e8400-e29b-41d4-a716-446655440000';
    const id = BoardId.from(uuid);

    expect(id.toString()).toBe(uuid);
  });

  it('throws on invalid UUID string', () => {
    expect(() => BoardId.from('not-a-uuid')).toThrow('Invalid BoardId');
  });

  it('throws on empty string', () => {
    expect(() => BoardId.from('')).toThrow('Invalid BoardId');
  });
});
