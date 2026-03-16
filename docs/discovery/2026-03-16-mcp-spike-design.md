# Technical Design: MCP Server Spike (Experiment 3)

**Date**: 2026-03-16
**Status**: Implementation starting

## Overview

Minimal MCP server with event-sourced SQLite to validate that MCP-as-single-write-path is viable for an agent-first kanban board.

## Project Structure

```
packages/mcp-server/
├── package.json
├── tsconfig.json
├── src/
│   ├── domain/
│   │   ├── events/card-events.ts
│   │   ├── entities/card.ts
│   │   ├── value-objects/card-id.ts
│   │   └── repositories/
│   │       ├── event-store.ts
│   │       └── card-read-model.ts
│   ├── application/
│   │   ├── use-cases/
│   │   │   ├── create-card.ts
│   │   │   ├── move-card.ts
│   │   │   └── list-cards.ts
│   │   └── projections/card-projection.ts
│   ├── infrastructure/
│   │   ├── persistence/
│   │   │   ├── sqlite-event-store.ts
│   │   │   ├── sqlite-card-read-model.ts
│   │   │   └── database.ts
│   │   └── mcp/
│   │       ├── server.ts
│   │       └── tool-schemas.ts
│   └── index.ts
└── tests/
```

## SQLite Schema

```sql
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  stream_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload TEXT NOT NULL,
  version INTEGER NOT NULL,
  occurred_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(stream_id, version)
);

CREATE TABLE IF NOT EXISTS cards (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  column_name TEXT NOT NULL DEFAULT 'todo',
  position INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

## Event Types

- `CardCreated`: `{ title, description, column, position }`
- `CardMoved`: `{ fromColumn, toColumn, position }`

## MCP Tools

| Tool | Input | Behavior |
|------|-------|----------|
| `create_card` | `{ title, description?, column? }` | Append CardCreated event, project to read model |
| `move_card` | `{ cardId, toColumn, position? }` | Validate card exists, append CardMoved event, update read model |
| `list_cards` | `{ column? }` | Query read model (read-only) |

## Key Decisions

- **Synchronous projection in same transaction** — event append + projection in one SQLite transaction
- **better-sqlite3** — synchronous API, no async wrappers needed
- **Application-level projection** (not SQLite triggers) — testable, domain logic stays in code
- **stdio transport** — MCP server communicates via stdin/stdout

## Validation Criteria

1. All 3 MCP tools callable from Claude Code via stdio
2. Events correctly appended on each mutation
3. Read model consistent with event log
4. Event replay reproduces same state
5. < 200ms per operation
6. Domain has zero infrastructure imports
