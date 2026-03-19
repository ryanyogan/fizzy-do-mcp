import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { FizzyClient } from '@fizzy-do-mcp/client';
import { REACTION_EMOJIS } from '@fizzy-do-mcp/shared';
import { wrapToolOperation } from '../utils.js';

/**
 * Registers reaction-related tools with the MCP server.
 *
 * Reactions are emoji-based responses that can be added to cards and comments.
 */
export function registerReactionTools(server: McpServer, client: FizzyClient): void {
  // List Card Reactions
  server.tool(
    'fizzy_list_card_reactions',
    'List all reactions on a card.',
    {
      card_number: z.number().describe('The card number'),
    },
    async ({ card_number }) => {
      return wrapToolOperation(
        () => client.reactions.listOnCard(card_number),
        (reactions) => `Found ${reactions.length} reaction(s)`,
      );
    },
  );

  // List Comment Reactions
  server.tool(
    'fizzy_list_comment_reactions',
    'List all reactions on a comment.',
    {
      card_number: z.number().describe('The card number'),
      comment_id: z.string().describe('The comment ID'),
    },
    async ({ card_number, comment_id }) => {
      return wrapToolOperation(
        () => client.reactions.listOnComment(card_number, comment_id),
        (reactions) => `Found ${reactions.length} reaction(s)`,
      );
    },
  );

  // Add Card Reaction
  server.tool(
    'fizzy_add_card_reaction',
    `Add a reaction to a card. Available emojis: ${REACTION_EMOJIS.join(', ')}`,
    {
      card_number: z.number().describe('The card number'),
      emoji: z.enum(REACTION_EMOJIS).describe('The reaction emoji'),
    },
    async ({ card_number, emoji }) => {
      return wrapToolOperation(
        () => client.reactions.addToCard(card_number, { emoji }),
        () => `Added ${emoji} reaction to card #${card_number}`,
      );
    },
  );

  // Add Comment Reaction
  server.tool(
    'fizzy_add_comment_reaction',
    `Add a reaction to a comment. Available emojis: ${REACTION_EMOJIS.join(', ')}`,
    {
      card_number: z.number().describe('The card number'),
      comment_id: z.string().describe('The comment ID'),
      emoji: z.enum(REACTION_EMOJIS).describe('The reaction emoji'),
    },
    async ({ card_number, comment_id, emoji }) => {
      return wrapToolOperation(
        () => client.reactions.addToComment(card_number, comment_id, { emoji }),
        () => `Added ${emoji} reaction to comment`,
      );
    },
  );

  // Remove Card Reaction
  server.tool(
    'fizzy_remove_card_reaction',
    'Remove a reaction from a card.',
    {
      card_number: z.number().describe('The card number'),
      reaction_id: z.string().describe('The reaction ID'),
    },
    async ({ card_number, reaction_id }) => {
      return wrapToolOperation(
        () => client.reactions.removeFromCard(card_number, reaction_id),
        'Reaction removed',
      );
    },
  );

  // Remove Comment Reaction
  server.tool(
    'fizzy_remove_comment_reaction',
    'Remove a reaction from a comment.',
    {
      card_number: z.number().describe('The card number'),
      comment_id: z.string().describe('The comment ID'),
      reaction_id: z.string().describe('The reaction ID'),
    },
    async ({ card_number, comment_id, reaction_id }) => {
      return wrapToolOperation(
        () => client.reactions.removeFromComment(card_number, comment_id, reaction_id),
        'Reaction removed',
      );
    },
  );
}
