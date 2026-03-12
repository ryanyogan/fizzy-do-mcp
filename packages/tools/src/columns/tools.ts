import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { FizzyClient } from '@fizzy-mcp/client';
import type { ColumnColorValue } from '@fizzy-mcp/shared';
import { wrapToolOperation } from '../utils.js';

/**
 * Zod schema for column color values.
 * Matches the CSS variable format used by Fizzy.
 */
const ColumnColorSchema = z
  .enum([
    'var(--color-card-default)', // Blue
    'var(--color-card-1)', // Gray
    'var(--color-card-2)', // Tan
    'var(--color-card-3)', // Yellow
    'var(--color-card-4)', // Lime
    'var(--color-card-5)', // Aqua
    'var(--color-card-6)', // Violet
    'var(--color-card-7)', // Purple
    'var(--color-card-8)', // Pink
  ])
  .describe(
    'Column color. Options: var(--color-card-default) (Blue), var(--color-card-1) (Gray), var(--color-card-2) (Tan), var(--color-card-3) (Yellow), var(--color-card-4) (Lime), var(--color-card-5) (Aqua), var(--color-card-6) (Violet), var(--color-card-7) (Purple), var(--color-card-8) (Pink)',
  );

/**
 * Registers column-related tools with the MCP server.
 *
 * Columns represent stages in a workflow on a board.
 * Cards move through columns as they progress.
 */
export function registerColumnTools(server: McpServer, client: FizzyClient): void {
  // List Columns
  server.tool(
    'fizzy_list_columns',
    'List all columns on a Fizzy board, sorted by position.',
    {
      board_id: z.string().describe('The board ID'),
    },
    async ({ board_id }) => {
      return wrapToolOperation(
        () => client.columns.list(board_id),
        (columns) => `Found ${columns.length} column(s)`,
      );
    },
  );

  // Get Column
  server.tool(
    'fizzy_get_column',
    'Get a specific column by ID.',
    {
      board_id: z.string().describe('The board ID'),
      column_id: z.string().describe('The column ID'),
    },
    async ({ board_id, column_id }) => {
      return wrapToolOperation(
        () => client.columns.getById(board_id, column_id),
        'Column retrieved',
      );
    },
  );

  // Create Column
  server.tool(
    'fizzy_create_column',
    'Create a new column on a Fizzy board.',
    {
      board_id: z.string().describe('The board ID'),
      name: z.string().min(1).describe('The column name'),
      color: ColumnColorSchema.optional(),
    },
    async ({ board_id, name, color }) => {
      return wrapToolOperation(
        () => client.columns.create(board_id, { name, color: color as ColumnColorValue }),
        (column) => `Created column "${column.name}"`,
      );
    },
  );

  // Update Column
  server.tool(
    'fizzy_update_column',
    'Update a column on a Fizzy board.',
    {
      board_id: z.string().describe('The board ID'),
      column_id: z.string().describe('The column ID'),
      name: z.string().min(1).optional().describe('New column name'),
      color: ColumnColorSchema.optional(),
    },
    async ({ board_id, column_id, name, color }) => {
      return wrapToolOperation(
        () =>
          client.columns.update(board_id, column_id, { name, color: color as ColumnColorValue }),
        'Column updated',
      );
    },
  );

  // Delete Column
  server.tool(
    'fizzy_delete_column',
    'Delete a column from a Fizzy board.',
    {
      board_id: z.string().describe('The board ID'),
      column_id: z.string().describe('The column ID'),
    },
    async ({ board_id, column_id }) => {
      return wrapToolOperation(
        () => client.columns.deleteColumn(board_id, column_id),
        'Column deleted',
      );
    },
  );
}
