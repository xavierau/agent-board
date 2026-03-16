import { describe, it, expect } from 'vitest';
import {
  AllowListActorValidator,
  OpenActorValidator,
} from '../../../src/infrastructure/validation/actor-validator.js';

describe('AllowListActorValidator', () => {
  it('accepts actors in the allow list', () => {
    const validator = new AllowListActorValidator(
      new Set(['alice', 'bob']),
    );
    expect(validator.validate('alice')).toBe(true);
    expect(validator.validate('bob')).toBe(true);
  });

  it('rejects actors not in the allow list', () => {
    const validator = new AllowListActorValidator(
      new Set(['alice']),
    );
    expect(validator.validate('eve')).toBe(false);
  });

  it('rejects empty string even if in list', () => {
    const validator = new AllowListActorValidator(new Set(['']));
    expect(validator.validate('')).toBe(true);
  });
});

describe('OpenActorValidator', () => {
  it('accepts any non-empty actorId', () => {
    const validator = new OpenActorValidator();
    expect(validator.validate('anyone')).toBe(true);
    expect(validator.validate('x')).toBe(true);
  });

  it('rejects empty actorId', () => {
    const validator = new OpenActorValidator();
    expect(validator.validate('')).toBe(false);
  });
});
