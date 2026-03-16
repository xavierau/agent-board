import { describe, it, expect } from 'vitest';
import { CommentId } from '../../../src/domain/value-objects/comment-id.js';

describe('CommentId', () => {
  it('generates a valid UUID', () => {
    const id = CommentId.generate();
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    expect(uuidRegex.test(id.toString())).toBe(true);
  });

  it('generates unique ids', () => {
    const a = CommentId.generate();
    const b = CommentId.generate();

    expect(a.toString()).not.toBe(b.toString());
  });

  it('creates from a valid UUID string', () => {
    const uuid = '550e8400-e29b-41d4-a716-446655440000';
    const id = CommentId.from(uuid);

    expect(id.toString()).toBe(uuid);
  });

  it('throws on invalid UUID string', () => {
    expect(() => CommentId.from('not-a-uuid')).toThrow('Invalid CommentId');
  });

  it('throws on empty string', () => {
    expect(() => CommentId.from('')).toThrow('Invalid CommentId');
  });
});
