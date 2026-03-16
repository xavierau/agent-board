import { describe, it, expect } from 'vitest';
import { writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { loadOrgConfig } from '../../../src/infrastructure/config/org-config-loader.js';

function createTempYaml(content: string): string {
  const dir = mkdtempSync(join(tmpdir(), 'org-test-'));
  const path = join(dir, 'org.yaml');
  writeFileSync(path, content, 'utf-8');
  return path;
}

const VALID_YAML = `
org:
  name: "Test Org"
agents:
  - id: "agent-1"
    display_name: "Agent One"
    role_type: "ic"
    identity:
      email: "one@test.local"
  - id: "agent-2"
    display_name: "Agent Two"
    role_type: "lead"
    identity:
      email: "two@test.local"
`;

describe('loadOrgConfig', () => {
  it('loads and parses valid YAML', () => {
    const path = createTempYaml(VALID_YAML);
    const config = loadOrgConfig(path);

    expect(config.org.name).toBe('Test Org');
    expect(config.agents).toHaveLength(2);
    expect(config.agents[0].id).toBe('agent-1');
    expect(config.agents[0].display_name).toBe('Agent One');
    expect(config.agents[0].role_type).toBe('ic');
    expect(config.agents[0].identity.email).toBe('one@test.local');
    expect(config.agents[1].id).toBe('agent-2');
    expect(config.agents[1].role_type).toBe('lead');
  });

  it('throws when file does not exist', () => {
    expect(() => loadOrgConfig('/nonexistent/path.yaml'))
      .toThrow();
  });

  it('throws when YAML is missing org field', () => {
    const path = createTempYaml(`
agents:
  - id: "a"
    display_name: "A"
    role_type: "ic"
    identity:
      email: "a@test.local"
`);
    expect(() => loadOrgConfig(path)).toThrow(/org/i);
  });

  it('throws when YAML is missing agents field', () => {
    const path = createTempYaml(`
org:
  name: "Test"
`);
    expect(() => loadOrgConfig(path)).toThrow(/agents/i);
  });

  it('throws when agent is missing required fields', () => {
    const path = createTempYaml(`
org:
  name: "Test"
agents:
  - id: "a"
`);
    expect(() => loadOrgConfig(path)).toThrow();
  });

  it('throws when role_type is invalid', () => {
    const path = createTempYaml(`
org:
  name: "Test"
agents:
  - id: "a"
    display_name: "A"
    role_type: "invalid"
    identity:
      email: "a@test.local"
`);
    expect(() => loadOrgConfig(path)).toThrow(/role_type/i);
  });
});
