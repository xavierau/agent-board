import { describe, it, expect } from 'vitest';
import { OrgActorValidator } from '../../../src/infrastructure/validation/actor-validator.js';
import type { OrgConfig } from '../../../src/domain/agent-config.js';

const TEST_CONFIG: OrgConfig = {
  org: { name: 'Test Org' },
  agents: [
    {
      id: 'agent-1',
      display_name: 'Agent One',
      role_type: 'ic',
      identity: { email: 'one@test.local' },
    },
    {
      id: 'agent-2',
      display_name: 'Agent Two',
      role_type: 'lead',
      identity: { email: 'two@test.local' },
    },
  ],
};

describe('OrgActorValidator', () => {
  it('validates known agents as true', () => {
    const validator = new OrgActorValidator(TEST_CONFIG);
    expect(validator.validate('agent-1')).toBe(true);
    expect(validator.validate('agent-2')).toBe(true);
  });

  it('rejects unknown agents', () => {
    const validator = new OrgActorValidator(TEST_CONFIG);
    expect(validator.validate('unknown')).toBe(false);
    expect(validator.validate('')).toBe(false);
  });

  it('returns correct agent config via getAgent', () => {
    const validator = new OrgActorValidator(TEST_CONFIG);
    const agent = validator.getAgent('agent-1');

    expect(agent).toBeDefined();
    expect(agent!.id).toBe('agent-1');
    expect(agent!.display_name).toBe('Agent One');
    expect(agent!.role_type).toBe('ic');
    expect(agent!.identity.email).toBe('one@test.local');
  });

  it('returns undefined for unknown agent via getAgent', () => {
    const validator = new OrgActorValidator(TEST_CONFIG);
    expect(validator.getAgent('unknown')).toBeUndefined();
  });

  it('returns all agents via getAllAgents', () => {
    const validator = new OrgActorValidator(TEST_CONFIG);
    const agents = validator.getAllAgents();

    expect(agents).toHaveLength(2);
    expect(agents[0].id).toBe('agent-1');
    expect(agents[1].id).toBe('agent-2');
  });

  it('isKnownAgent mirrors validate behavior', () => {
    const validator = new OrgActorValidator(TEST_CONFIG);
    expect(validator.isKnownAgent('agent-1')).toBe(true);
    expect(validator.isKnownAgent('nope')).toBe(false);
  });
});
