import { describe, it, expect } from 'vitest';
import { ActorId } from '../../../src/domain/value-objects/actor-id.js';

describe('ActorId', () => {
  it('creates from a valid string', () => {
    const id = ActorId.from('backend-engineer');

    expect(id.toString()).toBe('backend-engineer');
  });

  it('trims whitespace', () => {
    const id = ActorId.from('  backend-engineer  ');

    expect(id.toString()).toBe('backend-engineer');
  });

  it('throws on empty string', () => {
    expect(() => ActorId.from('')).toThrow('ActorId cannot be empty');
  });

  it('throws on whitespace-only string', () => {
    expect(() => ActorId.from('   ')).toThrow('ActorId cannot be empty');
  });

  it('accepts any non-empty string format', () => {
    const id = ActorId.from('user-123');

    expect(id.toString()).toBe('user-123');
  });
});
