/**
 * @fizzy-do-mcp/tools
 *
 * MCP tool definitions for the Fizzy API.
 *
 * This package provides tool registration functions that connect
 * the Fizzy API client to the MCP server, exposing Fizzy operations
 * as tools that AI agents can invoke.
 *
 * @example
 * ```typescript
 * import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
 * import { FizzyClient } from '@fizzy-do-mcp/client';
 * import { registerAllTools } from '@fizzy-do-mcp/tools';
 *
 * const server = new McpServer({ name: 'fizzy-do-mcp', version: '1.0.0' });
 * const client = new FizzyClient({ token: 'xxx', accountSlug: 'my-org' });
 *
 * registerAllTools(server, client);
 * ```
 *
 * @packageDocumentation
 */

// Main registration function
export { registerAllTools } from './register.js';

// Individual tool registrations for granular control
export { registerIdentityTools } from './identity/index.js';
export { registerBoardTools } from './boards/index.js';
export { registerCardTools } from './cards/index.js';
export { registerCommentTools } from './comments/index.js';
export { registerColumnTools } from './columns/index.js';
export { registerTagTools } from './tags/index.js';
export { registerUserTools } from './users/index.js';
export { registerWebhookTools } from './webhooks/index.js';
export { registerReactionTools } from './reactions/index.js';
export { registerStepTools } from './steps/index.js';
export { registerNotificationTools } from './notifications/index.js';
export { registerProjectManagerTools } from './project-manager/index.js';
export { registerPendingWorkTools } from './pending-work/index.js';

// Utilities
export { formatToolSuccess, formatToolError, wrapToolOperation } from './utils.js';
