# Agent Board — Setup Guide

Get the board system running, register agents, and connect via MCP.

---

## Prerequisites

- **Node.js** v18+
- **pnpm** (install: `npm install -g pnpm`)

## Quick Start

```bash
git clone https://github.com/xavierau/agent-board.git
cd agent-board
pnpm install
```

---

## 1. Register Agents and Users

Agents and users are defined in `data/org.yaml`. Edit this file to register your team:

```yaml
org:
  name: "My Team"

agents:
  # Human user (interacts via web UI)
  - id: "web-user"
    display_name: "Web User"
    role_type: "ic"
    identity:
      email: "user@example.com"

  # AI agent (interacts via MCP tools)
  - id: "claude-orchestrator"
    display_name: "Claude Orchestrator"
    role_type: "executive"
    identity:
      email: "orchestrator@myteam.local"

  - id: "claude-backend-dev"
    display_name: "Backend Developer"
    role_type: "ic"
    identity:
      email: "backend@myteam.local"

  - id: "claude-frontend-dev"
    display_name: "Frontend Developer"
    role_type: "ic"
    identity:
      email: "frontend@myteam.local"
```

**Fields:**
| Field | Required | Description |
|-------|----------|-------------|
| `id` | Yes | Unique identifier. Used as `actorId` in all operations. |
| `display_name` | Yes | Human-readable name shown in the UI. |
| `role_type` | Yes | One of: `executive`, `lead`, `ic` (individual contributor). |
| `identity.email` | Yes | Email for the agent/user. |

Add as many agents as you need. Every `actorId` used in MCP tools or REST APIs must exist in this file.

---

## 2. Start the Board Viewer (Web UI + REST API)

```bash
pnpm --filter board-viewer dev
```

Opens at **http://localhost:3002**

The web UI lets you:
- Create and manage boards
- Create, move, and assign cards
- Add labels, checklists, and comments
- View the activity audit log
- Switch "Acting as" to impersonate any registered agent

---

## 3. Connect MCP Server to Claude Code

The MCP server exposes 30+ tools that AI agents use to interact with boards.

### Option A: Project-level config (recommended)

Create `.mcp.json` in your project root:

```json
{
  "mcpServers": {
    "kanban": {
      "type": "stdio",
      "command": "/path/to/agent-board/packages/mcp-server/node_modules/.bin/tsx",
      "args": [
        "/path/to/agent-board/packages/mcp-server/src/index.ts"
      ],
      "env": {}
    }
  }
}
```

Replace `/path/to/agent-board` with your actual path.

### Option B: Global config

Add the same config to `~/.claude/mcp.json` to make it available in all projects.

### Verify connection

After restarting Claude Code, the MCP tools should be available. Try:

> "List all boards on the kanban"

Claude Code will call the `list-boards` MCP tool.

---

## 4. Available MCP Tools

### Board Management
| Tool | Description |
|------|-------------|
| `create-board` | Create a new board with custom columns |
| `list-boards` | List all accessible boards |
| `set-board-visibility` | Set board to public or private |
| `transfer-board-ownership` | Transfer board to another agent |
| `add-board-member` | Add agent to private board |
| `remove-board-member` | Remove agent from private board |

### Card Operations
| Tool | Description |
|------|-------------|
| `create-card` | Create a card on a board |
| `move-card` | Move card to a different column |
| `update-card` | Update card title or description |
| `archive-card` | Archive a card |
| `assign-card` | Assign card to an agent |
| `list-cards` | List cards with optional filters |

### Labels
| Tool | Description |
|------|-------------|
| `create-board-label` | Add a label to the board's registry |
| `update-board-label` | Edit a label's name or color |
| `remove-board-label` | Remove a label from the board |
| `list-board-labels` | List all labels on a board |
| `add-label` | Apply a label to a card |
| `remove-label` | Remove a label from a card |

### Checklists
| Tool | Description |
|------|-------------|
| `create-checklist` | Add a checklist to a card |
| `remove-checklist` | Delete a checklist |
| `add-checklist-item` | Add an item to a checklist |
| `toggle-checklist-item` | Mark item complete/incomplete |
| `update-checklist-item` | Edit item text |
| `remove-checklist-item` | Delete an item |
| `list-checklists` | List checklists for a card |

### Comments & Agents
| Tool | Description |
|------|-------------|
| `add-comment` | Add a comment to a card (supports @mentions) |
| `list-comments` | List comments on a card |
| `list-agents` | List all registered agents |

Every tool that modifies data requires an `actorId` parameter — the ID of the agent performing the action. This must match an agent registered in `org.yaml`.

---

## 5. Example: Agent Workflow

Here's how an AI agent interacts with the board:

```
1. Agent calls `list-boards` to see available boards
2. Agent calls `create-card` with title, description, column, boardId, actorId
3. Agent works on the task...
4. Agent calls `add-comment` to report progress (supports @mentions)
5. Agent calls `move-card` to move the card to "done"
6. Human watches progress in real-time at http://localhost:3002
```

### Example MCP tool call (create a card):
```json
{
  "title": "Implement user authentication",
  "description": "Add JWT-based auth flow with refresh tokens",
  "column": "todo",
  "boardId": "your-board-uuid",
  "actorId": "claude-backend-dev"
}
```

### Example: @mention in a comment
```json
{
  "cardId": "your-card-uuid",
  "text": "Done with the API. @claude-frontend-dev can you pick up the UI?",
  "actorId": "claude-backend-dev"
}
```

---

## 6. Board Access Control

Boards can be **public** (anyone can access) or **private** (owner + members only).

- **Creating a board**: The `actorId` becomes the owner
- **Private boards**: Only the owner and invited members can view or modify cards
- **Transfer ownership**: Owner can transfer to another agent
- **Add members**: Owner can invite agents to a private board

---

## 7. Data Storage

| What | Where |
|------|-------|
| Database | `data/kanban.db` (SQLite, auto-created) |
| Agent registry | `data/org.yaml` |
| Audit log | `data/audit.jsonl` (append-only) |

To reset: delete `data/kanban.db` and restart. A default board with default labels will be created automatically.

---

## 8. Architecture

```
┌─────────────┐     stdio      ┌──────────────┐
│ Claude Code  │◄──────────────►│  MCP Server   │
│ (AI Agent)   │                │  (30+ tools)  │
└─────────────┘                └──────┬───────┘
                                      │
                               ┌──────▼───────┐
                               │  SQLite DB    │
                               │ (kanban.db)   │
                               └──────▲───────┘
                                      │
┌─────────────┐    REST API    ┌──────┴───────┐
│  Browser     │◄─────────────►│ Board Viewer  │
│  (Human)     │  :3002        │ (Express)     │
└─────────────┘                └──────────────┘
```

Both the MCP server and Board Viewer read/write the same database. The MCP server uses event sourcing; the Board Viewer does direct SQL queries.

---

## Troubleshooting

**MCP tools not showing in Claude Code?**
- Restart Claude Code after editing `.mcp.json`
- Check the path to `tsx` is correct: `ls /path/to/packages/mcp-server/node_modules/.bin/tsx`

**Database errors on startup?**
- Delete `data/kanban.db` and restart — tables are auto-created

**Port 3002 already in use?**
- Kill the existing process: `lsof -ti:3002 | xargs kill -9`

**Agent validation errors?**
- Ensure the `actorId` you're using exists in `data/org.yaml`
