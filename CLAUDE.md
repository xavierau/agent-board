# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Local Trello clone — a kanban board app with drag-and-drop cards, lists, and boards. MCP-first approach (Model Context Protocol for tool integrations). Responsive React frontend, Express backend, TypeScript throughout, SQLite database, local file storage.

## Tech Stack

- **Package manager**: pnpm (always use `pnpm` — never npm/yarn)
- **Frontend**: React 18+, TypeScript, Vite, TailwindCSS
- **Backend**: Express, TypeScript, SQLite (via better-sqlite3), tsx for dev
- **Monorepo**: pnpm workspaces — `packages/frontend`, `packages/backend`, `packages/shared`
- **MCP**: Model Context Protocol server exposing board/list/card operations as tools

## Project Structure

```
packages/
  shared/          # Shared types, DTOs, validation schemas (Zod)
  backend/
    src/
      domain/        # Entities, value objects, repository interfaces
      application/   # Use cases / services
      infrastructure/
        database/    # SQLite repos, migrations
        storage/     # Local file storage service
        mcp/         # MCP server & tool definitions
      interface/
        http/        # Express routes, controllers, middleware
  frontend/
    src/
      components/    # Reusable UI components
      pages/         # Route-level page components
      hooks/         # Custom React hooks
      services/      # API client layer
      store/         # State management
```

## Commands

```bash
# Install all dependencies
pnpm install

# Development (runs both frontend + backend concurrently)
pnpm dev

# Run only backend or frontend
pnpm --filter backend dev
pnpm --filter frontend dev

# Build
pnpm build

# Lint & format
pnpm lint
pnpm format

# Tests
pnpm test                           # Run all tests
pnpm --filter backend test          # Backend tests only
pnpm --filter frontend test         # Frontend tests only
pnpm --filter backend test -- --grep "pattern"  # Single test by pattern

# Database
pnpm --filter backend migrate       # Run migrations
pnpm --filter backend seed           # Seed sample data
```

## Architecture Decisions

### MCP-First Approach
The backend exposes board operations via an MCP server alongside the REST API. MCP tools in `packages/backend/src/infrastructure/mcp/` mirror use cases so AI assistants can manipulate boards directly. The REST API and MCP tools share the same application layer — never duplicate business logic.

### Clean Architecture Layers
- **Domain** → pure TypeScript, no framework imports, no I/O
- **Application** → use cases orchestrate domain objects, depend on repository interfaces
- **Infrastructure** → implements interfaces (SQLite repos, file storage, MCP server)
- **Interface** → Express controllers, thin — call use cases and return responses

Dependencies flow inward only: Interface → Application → Domain. Infrastructure implements Domain interfaces.

### Local File Storage
Attachments/images stored on disk at `data/uploads/`. The `FileStorageService` interface lives in domain; implementation in infrastructure. Files referenced by relative path in the database.

### SQLite
Database file at `data/db.sqlite`. Migrations are sequential SQL files in `packages/backend/src/infrastructure/database/migrations/`. Use better-sqlite3 (synchronous API) — no ORM.

### Shared Package
`packages/shared` contains TypeScript types, Zod validation schemas, and DTOs shared between frontend and backend. Import as `@my-trello/shared`.

## API Conventions

- RESTful routes: `/api/boards`, `/api/boards/:id/lists`, `/api/lists/:id/cards`
- Request validation via Zod schemas from shared package
- Consistent error response: `{ error: string, details?: unknown }`
- Card ordering uses a `position` float field (fractional indexing for drag-and-drop)

## Frontend Conventions

- Mobile-first responsive design with TailwindCSS breakpoints
- Drag-and-drop via `@dnd-kit/core`
- API calls through a typed client in `services/api.ts` — components never call fetch directly
- Optimistic updates for card/list moves

## Testing

- Backend: vitest, integration tests hit real SQLite (in-memory `:memory:` for tests)
- Frontend: vitest + React Testing Library
- No mocks for database — use in-memory SQLite
