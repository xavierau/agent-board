# Brainstorm: Agent-First Kanban Platform

**Date**: 2026-03-16
**Mode**: Ideas for new product
**Context**: A local-first, MCP-native kanban system where AI agents are first-class citizens alongside humans — serving solo devs, small teams, and as pluggable infrastructure for orchestrators. Inspired by Paperclip (orchestration platform) and AgentOrg (org structure/RBAC library).

---

## PM Perspective

### P1. Dual-Identity Board System
**Impact**: H | **Effort**: H

Every entity (human or agent) gets a personal board auto-created on registration. Personal boards are private workspaces; project boards are shared. Cards can be "promoted" from personal to project boards, creating lineage tracking.

- **User value**: Agents can work autonomously in their own space without cluttering the shared board. Humans maintain oversight via the project board.
- **Key mechanic**: Card promotion creates a parent-child link. The project board card shows rolled-up status from the agent's personal sub-cards.
- **Open question**: Should agents see other agents' personal boards? Or only their own + project boards they're assigned to?

### P2. Agent Capability Registry
**Impact**: H | **Effort**: M

Agents declare capabilities (e.g., "can write code", "can review PRs", "can research") as structured metadata. When a card needs assignment, the system suggests or auto-assigns based on capability matching — like AgentOrg's directory lookup but integrated into the board UX.

- **User value**: Eliminates manual "which agent should I assign this to?" decisions. Enables auto-routing of incoming work.
- **Key mechanic**: Capabilities are tags with optional confidence scores. Matching algorithm considers capability + current workload + cost.
- **Open question**: Who defines an agent's capabilities — the agent itself, the admin, or both? How do capabilities evolve over time?

### P3. Task Decomposition Protocol
**Impact**: H | **Effort**: H

Any card can be "decomposed" into subtasks on the assignee's personal board. If an agent is assigned a card, it can autonomously break it into sub-cards on its own board, execute them, and roll up status to the parent. Humans see a progress summary; agents see actionable sub-cards.

- **User value**: This is the core "agent as first-class citizen" feature. Agents don't just execute — they plan, decompose, and manage their own work.
- **Key mechanic**: Parent card on project board → child cards on agent's personal board. Status rolls up: if 3/5 sub-cards are done, parent shows 60%. Agents can further decompose (recursive).
- **Open question**: How deep can decomposition go? Should there be a depth limit? What happens when a sub-task is blocked?

### P4. Delegation Chains with Approval Gates
**Impact**: H | **Effort**: M

Agents can delegate sub-tasks to other agents, but the system enforces configurable gates. E.g., "agent can auto-assign tasks under $5 budget, but needs human approval above that." Gates are visible as a column/swimlane on the board.

- **User value**: Enables autonomous multi-agent collaboration with human guardrails. Trust builds over time by relaxing gates.
- **Key mechanic**: Gates defined in org config (YAML/JSON). Gate check happens on card state transitions. Blocked cards land in "Needs Approval" column.
- **Open question**: How granular should gates be? Per-agent? Per-action-type? Per-cost-threshold?

### P5. Activity Cost Ledger
**Impact**: M | **Effort**: M

Every card tracks compute cost (tokens, API calls, time). Boards show a running cost dashboard. Budget limits can be set per agent, per project, or per card. When an agent approaches its limit, the card auto-moves to a "Needs Approval" column.

- **User value**: Prevents runaway agent costs. Makes the economics of agent work visible and manageable.
- **Key mechanic**: Agents report cost metadata with each action. Cost aggregates up from sub-cards to parent cards to boards.
- **Open question**: How do agents report costs? Self-reported? Measured by the system? Both?

### P6. Heartbeat / Cron Cards
**Impact**: M | **Effort**: L

Recurring cards that trigger agent work on a schedule. E.g., "Review open PRs every 6 hours" becomes a card that respawns. Bridges the gap between task management and autonomous agent scheduling.

- **User value**: Enables proactive agent behavior without external cron infrastructure.
- **Key mechanic**: Card has a `recurrence` field (cron expression). On completion, system auto-creates next instance. History preserved as linked cards.
- **Open question**: Should recurring cards share a single history thread or be independent?

---

## Designer Perspective

### D1. Unified Timeline View
**Impact**: H | **Effort**: M

A single chronological view showing interleaved human and agent activity across all boards. Humans see commit messages and comments; agent actions show tool calls, reasoning summaries, and artifacts. Makes the "black box" of agent work transparent.

- **User value**: Answers "what happened while I was away?" in one glance.
- **Key mechanic**: All events (human + agent) feed into a single timeline. Filterable by entity, board, event type. Agent events include a "reasoning summary" collapsible section.
- **Open question**: How much agent reasoning to surface? Full chain-of-thought? Summary only? User-configurable?

### D2. Agent Avatar & Status Presence
**Impact**: M | **Effort**: L

Agents appear as board members with real-time status indicators: idle, working, blocked, waiting-for-approval. Their avatar pulses when actively working on a card. Clicking shows a live activity feed.

- **User value**: Makes agents feel like visible teammates, not background processes. The moment users "get it."
- **Key mechanic**: Agent status derived from MCP heartbeat or last-action timestamp. Status: idle (>5min no action), working (active), blocked (gate hit), waiting (delegated).
- **Open question**: Should agents have customizable avatars? Or system-assigned by type?

### D3. Card Conversation Thread (Human + Agent)
**Impact**: H | **Effort**: M

Every card has a threaded conversation where both humans and agents can comment. Humans type naturally; agents post structured updates (progress %, blockers, artifacts). Supports @mentions to ping specific agents or humans.

- **User value**: The card becomes the single source of truth for all discussion and work product.
- **Key mechanic**: Comments are typed (human text, agent status update, agent artifact, agent question). Different visual treatment per type. @mention triggers notification via MCP event.
- **Open question**: Can agents @mention humans to ask questions and block until answered?

### D4. Adaptive Board Density
**Impact**: M | **Effort**: M

Mobile: card titles + status chips only. Tablet: adds assignee avatars and cost badges. Desktop: full card detail with inline previews. The information density scales with viewport. Agents via MCP get a headless JSON view.

- **User value**: Useful board experience on any device. Agents get exactly the data they need, no HTML parsing.
- **Key mechanic**: Three responsive breakpoints with distinct information architectures (not just reflowing the same content). MCP responses are structured data, not rendered views.
- **Open question**: Should mobile have gesture shortcuts (swipe to move card between columns)?

### D5. Drag-to-Delegate
**Impact**: H | **Effort**: M

Drag a card onto an agent's avatar to assign it. Drag between agents to re-delegate. The system checks RBAC in real-time and shows a red/green indicator during drag. If a gate is required, a modal pops with the approval flow.

- **User value**: Makes complex orchestration feel like moving sticky notes. Lowers the barrier to working with agents.
- **Key mechanic**: During drag, system runs `canPerform()` check. Visual feedback: green glow = allowed, red = denied, yellow = needs approval. Drop triggers assignment + optional gate flow.
- **Open question**: How to handle drag-to-delegate on mobile (no hover state)?

### D6. Board Diffing / Snapshot Replay
**Impact**: M | **Effort**: H

Boards auto-snapshot at intervals. Users can scrub a timeline slider to see the board at any point in time — who moved what, when, and why. Critical for debugging agent behavior.

- **User value**: Answers "why did the agent move this card to Done at 3am?" Full auditability.
- **Key mechanic**: Built on event sourcing — replay events up to timestamp T to reconstruct board state. Timeline slider in the UI with playback controls.
- **Open question**: How often to snapshot? Every event? Every N minutes? On-demand?

---

## Engineer Perspective

### E1. MCP as the Single Write Path
**Impact**: H | **Effort**: H

All board mutations (create card, move card, add comment) go through MCP tools — even the React frontend calls the same MCP tool definitions via a thin HTTP adapter. Guarantees agents and humans have identical capabilities.

- **User value**: No feature gaps between human UI and agent API. What a human can do, an agent can do, and vice versa.
- **Key mechanic**: MCP tool definitions are the source of truth. Express routes are thin adapters that translate HTTP → MCP tool call → response. Frontend calls REST, which calls MCP internally.
- **Open question**: Performance overhead of routing everything through MCP? Should high-frequency reads bypass MCP?

### E2. Event Sourcing on SQLite
**Impact**: H | **Effort**: H

Store all board changes as an append-only event log. Current board state is a materialized view. Enables: undo/redo, snapshot replay, audit trails, and conflict resolution when multiple agents modify the same board.

- **User value**: Full history, time travel, and conflict resolution come "for free" from the data model.
- **Key mechanic**: Events table: `(id, board_id, entity_id, event_type, payload, timestamp)`. Materialized views for current state. SQLite WAL mode for concurrent reads.
- **Open question**: When to compact/archive old events? How to handle event schema evolution?

### E3. Agent Session Sandboxing
**Impact**: H | **Effort**: M

Each agent gets an isolated SQLite WAL connection with row-level access scoped to its boards + assigned cards. Prevents a rogue agent from reading/modifying cards outside its scope.

- **User value**: Safety guarantee — agents can only touch what they're allowed to.
- **Key mechanic**: Middleware layer checks `agent_id` against card/board ownership before allowing writes. Read access also scoped. Maps to AgentOrg's deny-by-default RBAC.
- **Open question**: How to handle cross-board operations (e.g., promoting a card from personal to project board)?

### E4. Plugin Adapter Layer for Orchestrators
**Impact**: H | **Effort**: M

Expose a clean adapter interface so external orchestrators (Paperclip, CrewAI, AutoGen) can register their agents and sync tasks bidirectionally. The board becomes a universal task backend.

- **User value**: Not locked into one orchestration framework. Use the board with any agent system.
- **Key mechanic**: Adapter interface: `registerAgent()`, `syncTasks()`, `onEvent()`. Ship with a reference Paperclip adapter. Adapters live in `packages/adapters/`.
- **Open question**: How to handle conflicting state when an orchestrator and the board both modify the same card?

### E5. Webhook / Event Bus for Reactive Agents
**Impact**: M | **Effort**: L

When a card changes state, emit events (via SQLite triggers → local event bus). Agents can subscribe to events: "notify me when any card in Project X moves to Review."

- **User value**: Enables reactive agent behavior without polling. Agents respond to board changes in real-time.
- **Key mechanic**: SQLite trigger on events table → in-process event emitter → subscriber notification. Subscribers registered via MCP tool. External subscribers via webhook URL.
- **Open question**: Delivery guarantees? At-least-once? Exactly-once?

### E6. Portable Board Bundles
**Impact**: M | **Effort**: L

Export an entire board (cards, history, attachments, agent configs) as a single `.trello-bundle` file. Import into another instance.

- **User value**: Share project templates, back up, move between machines. Aligns with local-first philosophy.
- **Key mechanic**: Bundle = ZIP containing event log JSON + attachments + agent config YAML. Import replays events to reconstruct board.
- **Open question**: How to handle agent references that don't exist on the target instance?

---

## Top 5 Recommendations

| Rank | Idea | Rationale | Quick Win? |
|------|------|-----------|------------|
| 1 | E1. MCP as Single Write Path | Architectural foundation — if agents and humans share the same mutation path, RBAC, events, and audit compose cleanly | No — foundational |
| 2 | P3. Task Decomposition Protocol | The killer differentiator — agents plan, decompose, and manage their own work on their own boards | No — core feature |
| 3 | E2. Event Sourcing on SQLite | Data layer that enables replay, audit, undo, and reactive agents. SQLite + append-only log is performant for local-first | No — foundational |
| 4 | E5. Webhook / Event Bus | Low effort, high unlock. Combined with event sourcing, reactive agents are nearly free | **Yes** |
| 5 | D2. Agent Avatar & Status Presence | Simplest UX change that makes agents feel like real teammates. Ship in the first demo | **Yes** |

---

## References

- [Paperclip](https://github.com/paperclipai/paperclip) — Multi-agent orchestration platform for "zero-human companies"
- [AgentOrg](https://github.com/xavierau/agent-org) — Configuration-driven org structure, RBAC, and escalation for multi-agent systems
