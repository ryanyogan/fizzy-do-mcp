import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { FizzyClient } from '@fizzy-mcp/client';
import { wrapToolOperation } from '../utils.js';

/**
 * Registers comment-related tools with the MCP server.
 *
 * Comments are attached to cards and support rich text (HTML).
 */
export function registerCommentTools(server: McpServer, client: FizzyClient): void {
  // List Comments
  server.tool(
    'fizzy_list_comments',
    'List all comments on a Fizzy card, sorted chronologically (oldest first).',
    {
      card_number: z.number().describe('The card number'),
    },
    async ({ card_number }) => {
      return wrapToolOperation(
        () => client.comments.list(card_number),
        (comments) => `Found ${comments.length} comment(s) on card #${card_number}`,
      );
    },
  );

  // Get Comment
  server.tool(
    'fizzy_get_comment',
    'Get a specific comment by ID.',
    {
      card_number: z.number().describe('The card number'),
      comment_id: z.string().describe('The comment ID'),
    },
    async ({ card_number, comment_id }) => {
      return wrapToolOperation(
        () => client.comments.getById(card_number, comment_id),
        'Comment retrieved',
      );
    },
  );

  // Create Comment
  server.tool(
    'fizzy_create_comment',
    'Add a comment to a Fizzy card.',
    {
      card_number: z.number().describe('The card number'),
      body: z.string().min(1).describe('The comment body (supports HTML)'),
    },
    async ({ card_number, body }) => {
      return wrapToolOperation(
        () => client.comments.create(card_number, { body }),
        () => `Created comment on card #${card_number}`,
      );
    },
  );

  // Update Comment
  server.tool(
    'fizzy_update_comment',
    'Update a comment. Only the comment creator can update their comments.',
    {
      card_number: z.number().describe('The card number'),
      comment_id: z.string().describe('The comment ID'),
      body: z.string().min(1).describe('The new comment body (supports HTML)'),
    },
    async ({ card_number, comment_id, body }) => {
      return wrapToolOperation(
        () => client.comments.update(card_number, comment_id, { body }),
        'Comment updated',
      );
    },
  );

  // Delete Comment
  server.tool(
    'fizzy_delete_comment',
    'Delete a comment. Only the comment creator can delete their comments.',
    {
      card_number: z.number().describe('The card number'),
      comment_id: z.string().describe('The comment ID'),
    },
    async ({ card_number, comment_id }) => {
      return wrapToolOperation(
        () => client.comments.deleteComment(card_number, comment_id),
        'Comment deleted',
      );
    },
  );
}
