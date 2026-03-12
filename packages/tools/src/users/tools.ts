import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { FizzyClient } from '@fizzy-mcp/client';
import { wrapToolOperation } from '../utils.js';

/**
 * Registers user-related tools with the MCP server.
 *
 * Users represent people who have access to the Fizzy account.
 */
export function registerUserTools(server: McpServer, client: FizzyClient): void {
  // List Users
  server.tool(
    'fizzy_list_users',
    'List all active users in the Fizzy account. Use user IDs from this list to assign cards.',
    {},
    async () => {
      return wrapToolOperation(
        () => client.users.list(),
        (users) => `Found ${users.length} user(s)`,
      );
    },
  );

  // Get User
  server.tool(
    'fizzy_get_user',
    'Get details of a specific user by ID.',
    {
      user_id: z.string().describe('The user ID'),
    },
    async ({ user_id }) => {
      return wrapToolOperation(() => client.users.getById(user_id), 'User retrieved');
    },
  );
}
