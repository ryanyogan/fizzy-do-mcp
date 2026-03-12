import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { FizzyClient } from '@fizzy-mcp/client';
import { wrapToolOperation } from '../utils.js';

/**
 * Registers identity-related tools with the MCP server.
 *
 * These tools allow agents to discover user accounts and get account settings.
 */
export function registerIdentityTools(server: McpServer, client: FizzyClient): void {
  // Get Identity
  server.tool(
    'fizzy_get_identity',
    'Get the current user identity and list of accessible Fizzy accounts. Use this to discover available accounts.',
    {},
    async () => {
      return wrapToolOperation(
        () => client.identity.getIdentity(),
        (identity) => `Found ${identity.accounts.length} account(s)`,
      );
    },
  );

  // Get Account Settings
  server.tool(
    'fizzy_get_account',
    'Get the current Fizzy account settings including name, card count, and auto-postpone settings.',
    {},
    async () => {
      return wrapToolOperation(() => client.account.getSettings(), 'Account settings retrieved');
    },
  );
}
