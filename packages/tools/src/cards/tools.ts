import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { FizzyClient } from '@fizzy-mcp/client';
import { toRichText } from '@fizzy-mcp/shared';
import { wrapToolOperation } from '../utils.js';

/**
 * Registers card-related tools with the MCP server.
 *
 * These tools allow agents to manage Fizzy cards - the core work items.
 */
export function registerCardTools(server: McpServer, client: FizzyClient): void {
  // List Cards
  server.tool(
    'fizzy_list_cards',
    'List Fizzy cards with optional filters. Use this to search and browse cards.',
    {
      board_ids: z.array(z.string()).optional().describe('Filter by board ID(s)'),
      tag_ids: z.array(z.string()).optional().describe('Filter by tag ID(s)'),
      assignee_ids: z.array(z.string()).optional().describe('Filter by assignee user ID(s)'),
      indexed_by: z
        .enum(['all', 'closed', 'not_now', 'stalled', 'postponing_soon', 'golden'])
        .optional()
        .describe('Filter by card state'),
      sorted_by: z.enum(['latest', 'newest', 'oldest']).optional().describe('Sort order'),
      terms: z.array(z.string()).optional().describe('Search terms to filter cards'),
    },
    async (params) => {
      return wrapToolOperation(
        () => client.cards.list(params),
        (cards) => `Found ${cards.length} card(s)`,
      );
    },
  );

  // Get Card
  server.tool(
    'fizzy_get_card',
    'Get details of a specific Fizzy card by its number.',
    {
      card_number: z.number().describe('The card number (visible in Fizzy URLs)'),
    },
    async ({ card_number }) => {
      return wrapToolOperation(() => client.cards.getByNumber(card_number), 'Card retrieved');
    },
  );

  // Create Card
  server.tool(
    'fizzy_create_card',
    'Create a new Fizzy card on a board.',
    {
      board_id: z.string().describe('The board ID to create the card on'),
      title: z.string().min(1).describe('The card title'),
      description: z
        .string()
        .optional()
        .describe('Card description. Supports markdown (bold, italic, links, lists, code) or HTML.'),
      status: z
        .enum(['drafted', 'published'])
        .optional()
        .default('published')
        .describe('Card status - drafted cards are only visible to the creator'),
      tag_ids: z.array(z.string()).optional().describe('Tag IDs to apply to the card'),
    },
    async ({ board_id, title, description, status, tag_ids }) => {
      return wrapToolOperation(
        () =>
          client.cards.create(board_id, {
            title,
            description: description ? toRichText(description) : undefined,
            status,
            tag_ids,
          }),
        (card) => `Created card #${card.number}: "${card.title}"`,
      );
    },
  );

  // Update Card
  server.tool(
    'fizzy_update_card',
    'Update an existing Fizzy card.',
    {
      card_number: z.number().describe('The card number'),
      title: z.string().min(1).optional().describe('New title for the card'),
      description: z
        .string()
        .optional()
        .describe('New description. Supports markdown (bold, italic, links, lists, code) or HTML.'),
      status: z.enum(['drafted', 'published']).optional().describe('Card status'),
      tag_ids: z.array(z.string()).optional().describe('Tag IDs to set on the card'),
    },
    async ({ card_number, title, description, status, tag_ids }) => {
      return wrapToolOperation(
        () =>
          client.cards.update(card_number, {
            title,
            description: description ? toRichText(description) : undefined,
            status,
            tag_ids,
          }),
        (card) => `Updated card #${card.number}`,
      );
    },
  );

  // Delete Card
  server.tool(
    'fizzy_delete_card',
    'Delete a Fizzy card. Only the card creator or board administrators can delete cards.',
    {
      card_number: z.number().describe('The card number to delete'),
    },
    async ({ card_number }) => {
      return wrapToolOperation(
        () => client.cards.deleteCard(card_number),
        `Card #${card_number} deleted`,
      );
    },
  );

  // Close Card
  server.tool(
    'fizzy_close_card',
    'Close (complete) a Fizzy card, marking it as done.',
    {
      card_number: z.number().describe('The card number to close'),
    },
    async ({ card_number }) => {
      return wrapToolOperation(
        () => client.cards.close(card_number),
        `Card #${card_number} closed`,
      );
    },
  );

  // Reopen Card
  server.tool(
    'fizzy_reopen_card',
    'Reopen a closed Fizzy card.',
    {
      card_number: z.number().describe('The card number to reopen'),
    },
    async ({ card_number }) => {
      return wrapToolOperation(
        () => client.cards.reopen(card_number),
        `Card #${card_number} reopened`,
      );
    },
  );

  // Postpone Card
  server.tool(
    'fizzy_postpone_card',
    'Move a Fizzy card to "Not Now" status, deferring it for later.',
    {
      card_number: z.number().describe('The card number to postpone'),
    },
    async ({ card_number }) => {
      return wrapToolOperation(
        () => client.cards.postpone(card_number),
        `Card #${card_number} moved to Not Now`,
      );
    },
  );

  // Triage Card
  server.tool(
    'fizzy_triage_card',
    'Move a Fizzy card into a specific column on the board.',
    {
      card_number: z.number().describe('The card number to triage'),
      column_id: z.string().describe('The column ID to move the card into'),
    },
    async ({ card_number, column_id }) => {
      return wrapToolOperation(
        () => client.cards.triage(card_number, column_id),
        `Card #${card_number} triaged to column`,
      );
    },
  );

  // Untriage Card
  server.tool(
    'fizzy_untriage_card',
    'Send a Fizzy card back to triage, removing it from its column.',
    {
      card_number: z.number().describe('The card number to untriage'),
    },
    async ({ card_number }) => {
      return wrapToolOperation(
        () => client.cards.untriage(card_number),
        `Card #${card_number} sent back to triage`,
      );
    },
  );

  // Toggle Tag
  server.tool(
    'fizzy_tag_card',
    'Toggle a tag on a Fizzy card. If the tag is not on the card, it will be added. If it is, it will be removed.',
    {
      card_number: z.number().describe('The card number'),
      tag_title: z.string().describe('The tag title (without leading #)'),
    },
    async ({ card_number, tag_title }) => {
      return wrapToolOperation(
        () => client.cards.toggleTag(card_number, tag_title),
        `Tag "${tag_title}" toggled on card #${card_number}`,
      );
    },
  );

  // Toggle Assignment
  server.tool(
    'fizzy_assign_card',
    'Toggle assignment of a user to a Fizzy card. If the user is not assigned, they will be added. If they are, they will be removed.',
    {
      card_number: z.number().describe('The card number'),
      assignee_id: z.string().describe('The user ID to assign/unassign'),
    },
    async ({ card_number, assignee_id }) => {
      return wrapToolOperation(
        () => client.cards.toggleAssignment(card_number, assignee_id),
        `Assignment toggled for user on card #${card_number}`,
      );
    },
  );

  // Watch Card
  server.tool(
    'fizzy_watch_card',
    'Subscribe to notifications for a Fizzy card.',
    {
      card_number: z.number().describe('The card number to watch'),
    },
    async ({ card_number }) => {
      return wrapToolOperation(
        () => client.cards.watch(card_number),
        `Now watching card #${card_number}`,
      );
    },
  );

  // Unwatch Card
  server.tool(
    'fizzy_unwatch_card',
    'Unsubscribe from notifications for a Fizzy card.',
    {
      card_number: z.number().describe('The card number to unwatch'),
    },
    async ({ card_number }) => {
      return wrapToolOperation(
        () => client.cards.unwatch(card_number),
        `Stopped watching card #${card_number}`,
      );
    },
  );

  // Pin Card
  server.tool(
    'fizzy_pin_card',
    'Pin a Fizzy card for quick access.',
    {
      card_number: z.number().describe('The card number to pin'),
    },
    async ({ card_number }) => {
      return wrapToolOperation(
        () => client.cards.pin(card_number),
        `Card #${card_number} pinned`,
      );
    },
  );

  // Unpin Card
  server.tool(
    'fizzy_unpin_card',
    'Unpin a Fizzy card.',
    {
      card_number: z.number().describe('The card number to unpin'),
    },
    async ({ card_number }) => {
      return wrapToolOperation(
        () => client.cards.unpin(card_number),
        `Card #${card_number} unpinned`,
      );
    },
  );

  // Mark Golden
  server.tool(
    'fizzy_mark_golden',
    'Mark a Fizzy card as golden (important).',
    {
      card_number: z.number().describe('The card number to mark as golden'),
    },
    async ({ card_number }) => {
      return wrapToolOperation(
        () => client.cards.markGolden(card_number),
        `Card #${card_number} marked as golden`,
      );
    },
  );

  // Unmark Golden
  server.tool(
    'fizzy_unmark_golden',
    'Remove golden status from a Fizzy card.',
    {
      card_number: z.number().describe('The card number to unmark'),
    },
    async ({ card_number }) => {
      return wrapToolOperation(
        () => client.cards.unmarkGolden(card_number),
        `Card #${card_number} unmarked as golden`,
      );
    },
  );
}
