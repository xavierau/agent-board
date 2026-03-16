# Experiment Plan: Agent-First Kanban Platform

**Date**: 2026-03-16
**Status**: Active

---

## Hypotheses

| # | Hypothesis (XYZ+S) | Tests Idea |
|---|---------------------|------------|
| H1 | 70% of solo devs using AI agents say "I lose track of what my agent is doing" within 1 week | P3, D1 |
| H2 | 50% of users with agent avatars on a board will assign tasks via board (not CLI) in first session | D2, D5 |
| H3 | 60% of multi-agent users cite "control what agents can access" as top-3 concern | P4, E3 |
| H4 | 40% of orchestrator devs will integrate a task board API if setup < 30 min | E4 |
| H5 | 80% of users prefer decomposed sub-cards over flat log when debugging a failed agent task | P3, D1 |

---

## Experiments

### Experiment 1: Problem Interviews (5-8 users)
- **Tests**: H1, H3
- **Method**: 30-min interviews with AI agent users
- **Effort**: Low | **Timeline**: 1 week
- **Status**: Not started
- **Success criteria**: 5+ of 8 describe task visibility or agent control as top-3 pain
- **Key questions**:
  - "Walk me through the last time an AI agent worked on a task for you"
  - "How do you keep track of what your agents are doing?"
  - "Have you ever had an agent do something you didn't want?"

### Experiment 2: Figma Clickable Prototype
- **Tests**: H2, H5
- **Method**: 3-screen prototype tested with 5 users
- **Effort**: Medium | **Timeline**: 1 week
- **Status**: Not started
- **Success criteria**: 4/5 users find the blocked sub-task within 30 seconds
- **Screens**: Project board with avatars → Agent personal board → Card detail with conversation

### Experiment 3: MCP-Only Spike ✓ COMPLETE
- **Tests**: E1 (MCP as single write path), E2 (event sourcing viability)
- **Method**: Minimal MCP server + SQLite, 3 tools only
- **Effort**: Medium | **Timeline**: 3 days
- **Status**: Complete (2026-03-16)
- **Success criteria**:
  1. MCP round-trip works end-to-end
  2. Claude Code can create and move cards via MCP tools
  3. Latency < 200ms per operation
  4. Event log captures all mutations
- **Scope**:
  - MCP tools: `create_card`, `move_card`, `list_cards`
  - SQLite with event sourcing (append-only events table + materialized board state)
  - No frontend, no REST API, no auth
  - Test by connecting Claude Code to the MCP server
- **What we'll learn**:
  - Is MCP-as-single-write-path technically viable?
  - Do agents naturally use board primitives to organize work?
  - Is event sourcing on SQLite performant at local scale?

### Experiment 4: Community Poll
- **Tests**: H1, H4
- **Method**: Post in r/LocalLLaMA, r/ClaudeAI, AI agent Discords
- **Effort**: Low | **Timeline**: 2 days
- **Status**: Not started

### Experiment 5: Concierge MVP ✓ COMPLETE
- **Tests**: H2, H5
- **Method**: Real MCP kanban board with live web viewer — agent decomposes and executes tasks while user watches board
- **Effort**: Medium | **Timeline**: 1 day
- **Status**: Complete (2026-03-16)

---

## Schedule

```
Week 1 (Mar 16-22):  Exp 3 (MCP spike) + Exp 4 (community poll) in parallel
                     Start recruiting for Exp 1
Week 2 (Mar 23-29):  Exp 1 (interviews) + Exp 5 (concierge)
Week 3 (Mar 30-Apr 5): Exp 2 (prototype) — informed by interviews
Week 4 (Apr 6-12):   Synthesize → Go/No-Go per feature area
```

---

## Results Log

### Experiment 3: MCP-Only Spike
- **Start date**: 2026-03-16
- **End date**: 2026-03-16
- **Verdict**: ALL 4 SUCCESS CRITERIA MET
- **Findings**:
  1. MCP round-trip works end-to-end via stdio transport — stable, no issues
  2. Claude Code creates/moves/lists cards naturally via MCP tools
  3. All operations < 200ms (effectively instant on local SQLite)
  4. Event log captures all mutations (CardCreated, CardMoved events persisted)
- **Bonus insight**: Config setup was the hardest part — `.mcp.json` at project root is the correct location for Claude Code MCP servers
- **Conclusion**: MCP-as-single-write-path is viable. Event sourcing on SQLite works well at local scale. Proceed with building on this foundation.

### Experiment 5: Concierge MVP
- **Start date**: 2026-03-16
- **End date**: 2026-03-16
- **Verdict**: SUCCESS CRITERIA MET — observer could describe agent progress from board
- **Method**: Two rounds of real agent work with board tracking:
  1. **Round 1** (no viewer): Built todo app — 6 sub-cards decomposed, executed, moved through columns. User could not independently verify (no UI).
  2. **Round 2** (with viewer): Built board viewer + write features — 4 sub-cards decomposed, executed with parallel work. User watched live at http://localhost:3002.
- **Findings (H2 — do users assign tasks via board?)**:
  1. User could accurately describe what agent was working on: "you are working on refine the board frontend"
  2. Board provided at-a-glance status without needing to read chat log
  3. However, user needed a web viewer to actually observe — MCP tools alone are agent-facing only
- **Findings (H5 — do sub-cards beat flat logs?)**:
  1. User confirmed decomposed sub-cards made progress legible: "working fine"
  2. User noticed parallel work pattern (3 cards moving to DOING simultaneously): "yes"
  3. Granularity level (4-6 cards per task) was "looks good right now"
- **Key insight**: The board is only useful if the human has an independent viewer. MCP tools alone create a one-sided experience — the agent can see/update the board but the human cannot. A web UI or CLI viewer is essential for the concierge model.
- **Conclusion**: Decomposed sub-cards on a kanban board make agent work legible. H5 is directionally validated (n=1). H2 needs more users to test. The web viewer is a critical component, not optional.
