import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { FizzyClient } from '@fizzy-mcp/client';
import { registerIdentityTools } from './identity/index.js';
import { registerBoardTools } from './boards/index.js';
import { registerCardTools } from './cards/index.js';
import { registerCommentTools } from './comments/index.js';
import { registerColumnTools } from './columns/index.js';
import { registerTagTools } from './tags/index.js';
import { registerUserTools } from './users/index.js';

/**
 * Registers all Fizzy MCP tools with the server.
 *
 * This is the main entry point for tool registration. It registers
 * all 35 tools across 7 categories:
 *
 * - Identity (2 tools): Account discovery and settings
 * - Boards (7 tools): Board CRUD and management
 * - Cards (18 tools): Card CRUD, workflow, and assignments
 * - Comments (5 tools): Comment CRUD on cards
 * - Columns (5 tools): Column CRUD on boards
 * - Tags (1 tool): Tag listing
 * - Users (2 tools): User listing and details
 *
 * @param server - The MCP server instance
 * @param client - The Fizzy API client
 *
 * @example
 * ```typescript
 * import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
 * import { FizzyClient } from '@fizzy-mcp/client';
 * import { registerAllTools } from '@fizzy-mcp/tools';
 *
 * const server = new McpServer({ name: 'fizzy-mcp', version: '1.0.0' });
 * const client = new FizzyClient({ token: 'xxx', accountSlug: 'my-org' });
 *
 * registerAllTools(server, client);
 * ```
 */
export function registerAllTools(server: McpServer, client: FizzyClient): void {
  registerIdentityTools(server, client);
  registerBoardTools(server, client);
  registerCardTools(server, client);
  registerCommentTools(server, client);
  registerColumnTools(server, client);
  registerTagTools(server, client);
  registerUserTools(server, client);
}
