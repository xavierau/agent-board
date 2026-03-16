export interface AgentIdentity {
  readonly email: string;
}

export type RoleType = 'executive' | 'lead' | 'ic';

export interface AgentConfig {
  readonly id: string;
  readonly display_name: string;
  readonly role_type: RoleType;
  readonly identity: AgentIdentity;
}

export interface OrgConfig {
  readonly org: { readonly name: string };
  readonly agents: readonly AgentConfig[];
}
