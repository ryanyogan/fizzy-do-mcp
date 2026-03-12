import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { FizzyClient } from '@fizzy-mcp/client';
import { wrapToolOperation } from '../utils.js';

/**
 * Registers tag-related tools with the MCP server.
 *
 * Tags are labels that can be applied to cards for organization and filtering.
 */
export function registerTagTools(server: McpServer, client: FizzyClient): void {
  // List Tags
  server.tool(
    'fizzy_list_tags',
    'List all tags in the Fizzy account, sorted alphabetically. Use tag IDs from this list to filter cards or apply tags.',
    {},
    async () => {
      return wrapToolOperation(
        () => client.tags.list(),
        (tags) => `Found ${tags.length} tag(s)`,
      );
    },
  );
}
