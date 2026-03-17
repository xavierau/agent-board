import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createDatabase } from './infrastructure/persistence/database.js';
import { createMcpServer } from './infrastructure/mcp/server.js';
import { OrgActorValidator } from './infrastructure/validation/actor-validator.js';
import { loadOrgConfig } from './infrastructure/config/org-config-loader.js';
import { buildUseCases } from './composition-root.js';
import type { CreateBoardLabelUseCase } from './application/use-cases/create-board-label.js';

const DEFAULT_LABELS = [
  { name: 'bug', color: '#cf222e' },
  { name: 'feature', color: '#1a7f37' },
  { name: 'urgent', color: '#bc4c00' },
  { name: 'documentation', color: '#0969da' },
  { name: 'improvement', color: '#8250df' },
] as const;

async function main(): Promise<void> {
  const dataDir = ensureDataDir();
  const db = createDatabase(join(dataDir, 'kanban.db'));

  const orgPath = join(dataDir, 'org.yaml');
  const orgConfig = loadOrgConfig(orgPath);
  const validator = new OrgActorValidator(orgConfig);

  const { useCases, boardReadModel, cardReadModel } = buildUseCases(db, validator);
  ensureDefaultBoard(useCases);

  const deps = {
    useCases,
    actorValidator: validator,
    agentRegistry: validator,
    boardReadModel,
    cardReadModel,
  };

  const server = createMcpServer(deps);
  const transport = new StdioServerTransport();
  await server.connect(transport);

  const agentCount = validator.getAllAgents().length;
  console.error(`Kanban MCP Server running on stdio (${agentCount} agents loaded)`);
}

function ensureDataDir(): string {
  const root = new URL('../../..', import.meta.url).pathname;
  const dataDir = join(root, 'data');
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true });
  }
  return dataDir;
}

function ensureDefaultBoard(
  useCases: ReturnType<typeof buildUseCases>['useCases'],
): void {
  const boards = useCases.listBoards.execute();
  if (boards.length > 0) return;

  const { boardId } = useCases.createBoard.execute({
    name: 'Default Board',
    actorId: 'system',
  });
  seedDefaultLabels(useCases.createBoardLabel, boardId);
  console.error('Created default board with labels');
}

function seedDefaultLabels(
  createLabel: CreateBoardLabelUseCase,
  boardId: string,
): void {
  for (const { name, color } of DEFAULT_LABELS) {
    createLabel.execute({ boardId, name, color, actorId: 'system' });
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
