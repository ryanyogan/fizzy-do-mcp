import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { FizzyClient } from '@fizzy-mcp/client';
import { wrapToolOperation } from '../utils.js';

/**
 * Registers board-related tools with the MCP server.
 *
 * These tools allow agents to manage Fizzy boards.
 */
export function registerBoardTools(server: McpServer, client: FizzyClient): void {
  // List Boards
  server.tool(
    'fizzy_list_boards',
    'List all Fizzy boards you have access to in the current account.',
    {},
    async () => {
      return wrapToolOperation(
        () => client.boards.list(),
        (boards) => `Found ${boards.length} board(s)`,
      );
    },
  );

  // Get Board
  server.tool(
    'fizzy_get_board',
    'Get details of a specific Fizzy board by its ID.',
    {
      board_id: z.string().describe('The unique identifier of the board'),
    },
    async ({ board_id }) => {
      return wrapToolOperation(() => client.boards.getById(board_id), 'Board retrieved');
    },
  );

  // Create Board
  server.tool(
    'fizzy_create_board',
    'Create a new Fizzy board.',
    {
      name: z.string().min(1).describe('The name of the board'),
      all_access: z
        .boolean()
        .optional()
        .default(true)
        .describe('Whether all account users can access this board'),
      auto_postpone_period_in_days: z
        .number()
        .positive()
        .optional()
        .describe('Days of inactivity before cards are auto-postponed'),
    },
    async ({ name, all_access, auto_postpone_period_in_days }) => {
      return wrapToolOperation(
        () =>
          client.boards.create({
            name,
            all_access,
            auto_postpone_period_in_days,
          }),
        (board) => `Created board "${board.name}" (${board.id})`,
      );
    },
  );

  // Update Board
  server.tool(
    'fizzy_update_board',
    'Update an existing Fizzy board. Only board administrators can update boards.',
    {
      board_id: z.string().describe('The unique identifier of the board'),
      name: z.string().min(1).optional().describe('New name for the board'),
      all_access: z
        .boolean()
        .optional()
        .describe('Whether all account users can access this board'),
      auto_postpone_period_in_days: z
        .number()
        .positive()
        .optional()
        .describe('Days of inactivity before cards are auto-postponed'),
    },
    async ({ board_id, name, all_access, auto_postpone_period_in_days }) => {
      return wrapToolOperation(
        () =>
          client.boards.update(board_id, {
            name,
            all_access,
            auto_postpone_period_in_days,
          }),
        'Board updated successfully',
      );
    },
  );

  // Delete Board
  server.tool(
    'fizzy_delete_board',
    'Delete a Fizzy board. Only board administrators can delete boards. This action is irreversible.',
    {
      board_id: z.string().describe('The unique identifier of the board to delete'),
    },
    async ({ board_id }) => {
      return wrapToolOperation(() => client.boards.deleteBoard(board_id), 'Board deleted');
    },
  );

  // Publish Board
  server.tool(
    'fizzy_publish_board',
    'Publish a Fizzy board, making it publicly accessible via a shareable link.',
    {
      board_id: z.string().describe('The unique identifier of the board to publish'),
    },
    async ({ board_id }) => {
      return wrapToolOperation(
        () => client.boards.publish(board_id),
        (board) => `Board published. Public URL: ${board.public_url}`,
      );
    },
  );

  // Unpublish Board
  server.tool(
    'fizzy_unpublish_board',
    'Unpublish a Fizzy board, removing public access.',
    {
      board_id: z.string().describe('The unique identifier of the board to unpublish'),
    },
    async ({ board_id }) => {
      return wrapToolOperation(() => client.boards.unpublish(board_id), 'Board unpublished');
    },
  );
}
