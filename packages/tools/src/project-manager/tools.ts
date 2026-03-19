import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { FizzyClient } from '@fizzy-do-mcp/client';
import { wrapToolOperation, formatToolSuccess, formatToolError } from '../utils.js';

/**
 * Registers Project Manager tools with the MCP server.
 *
 * These tools enable AI assistants to work autonomously on Fizzy cards,
 * tracking sessions, reporting progress, and managing project context.
 * This is the key differentiator that transforms Fizzy Do from a simple
 * MCP server into an autonomous project management assistant.
 */
export function registerProjectManagerTools(server: McpServer, client: FizzyClient): void {
  // Get Actionable Cards
  server.tool(
    'fizzy_pm_actionable_cards',
    `Get cards that are ready for AI work. Returns cards that are:
- Golden (marked as important)
- Assigned to the current user
- Recently active

Use this to discover what work needs to be done.`,
    {
      board_id: z.string().optional().describe('Filter to a specific board'),
      limit: z.number().optional().default(10).describe('Maximum number of cards to return'),
    },
    async ({ board_id, limit }) => {
      // Get golden cards first (highest priority)
      const goldenResult = await client.cards.list({
        indexed_by: 'golden',
        board_ids: board_id ? [board_id] : undefined,
      });

      if (!goldenResult.ok) {
        return formatToolError(goldenResult.error);
      }

      // Get cards assigned to current user
      const identityResult = await client.identity.getIdentity();
      if (!identityResult.ok) {
        return formatToolError(identityResult.error);
      }

      // Get the user ID from the first account (or the matching account)
      const account = identityResult.value.accounts[0];
      if (!account) {
        return formatToolSuccess([], 'No accounts found');
      }
      const userId = account.user.id;
      const assignedResult = await client.cards.list({
        assignee_ids: [userId],
        board_ids: board_id ? [board_id] : undefined,
      });

      if (!assignedResult.ok) {
        return formatToolError(assignedResult.error);
      }

      // Combine and deduplicate
      const cardMap = new Map<number, (typeof goldenResult.value)[0]>();
      for (const card of goldenResult.value) {
        cardMap.set(card.number, card);
      }
      for (const card of assignedResult.value) {
        cardMap.set(card.number, card);
      }

      const actionableCards = Array.from(cardMap.values())
        .slice(0, limit)
        .map((card) => ({
          number: card.number,
          title: card.title,
          board: card.board.name,
          is_golden: card.golden,
          assignees: card.assignees?.map((a) => a.name) ?? [],
          tags: card.tags,
          url: card.url,
        }));

      return formatToolSuccess(
        actionableCards,
        `Found ${actionableCards.length} actionable card(s)`,
      );
    },
  );

  // Get Project Context
  server.tool(
    'fizzy_pm_project_context',
    `Get comprehensive context about a project/board for AI decision-making.
Includes: board structure, column workflow, and card statistics.

Use this before starting work on a board to understand the project state.`,
    {
      board_id: z.string().describe('The board ID to get context for'),
    },
    async ({ board_id }) => {
      // Get board details
      const boardResult = await client.boards.getById(board_id);
      if (!boardResult.ok) {
        return formatToolError(boardResult.error);
      }

      // Get columns
      const columnsResult = await client.columns.list(board_id);
      if (!columnsResult.ok) {
        return formatToolError(columnsResult.error);
      }

      // Get all cards
      const allCardsResult = await client.cards.list({ board_ids: [board_id] });
      if (!allCardsResult.ok) {
        return formatToolError(allCardsResult.error);
      }

      // Get stalled cards
      const stalledResult = await client.cards.list({
        board_ids: [board_id],
        indexed_by: 'stalled',
      });

      // Get golden cards
      const goldenResult = await client.cards.list({
        board_ids: [board_id],
        indexed_by: 'golden',
      });

      // Get closed cards
      const closedResult = await client.cards.list({
        board_ids: [board_id],
        indexed_by: 'closed',
      });

      // Get not now (postponed) cards
      const postponedResult = await client.cards.list({
        board_ids: [board_id],
        indexed_by: 'not_now',
      });

      const board = boardResult.value;
      const columns = columnsResult.value;
      const allCards = allCardsResult.value;
      const stalledCards = stalledResult.ok ? stalledResult.value : [];
      const goldenCards = goldenResult.ok ? goldenResult.value : [];
      const closedCards = closedResult.ok ? closedResult.value : [];
      const postponedCards = postponedResult.ok ? postponedResult.value : [];

      const context = {
        board: {
          id: board.id,
          name: board.name,
          auto_postpone_days: board.auto_postpone_period_in_days,
        },
        workflow: columns.map((col) => ({
          id: col.id,
          name: col.name,
          color: col.color,
        })),
        stats: {
          total: allCards.length,
          stalled: stalledCards.length,
          golden: goldenCards.length,
          closed: closedCards.length,
          postponed: postponedCards.length,
        },
        attention_needed: [
          ...stalledCards.slice(0, 3).map((c) => ({
            number: c.number,
            title: c.title,
            reason: 'stalled' as const,
          })),
          ...goldenCards.slice(0, 3).map((c) => ({
            number: c.number,
            title: c.title,
            reason: 'golden' as const,
          })),
        ],
      };

      return formatToolSuccess(context, `Project context for "${board.name}"`);
    },
  );

  // Report Progress
  server.tool(
    'fizzy_pm_report_progress',
    `Report progress made on a card by adding a structured comment.
Use this to document work done during an AI session.

The comment will be formatted as a progress report with:
- Summary of work done
- Changes made
- Any blockers or next steps`,
    {
      card_number: z.number().describe('The card number'),
      summary: z.string().describe('Brief summary of work completed'),
      changes: z.array(z.string()).optional().describe('List of specific changes made'),
      blockers: z.array(z.string()).optional().describe('Any blockers encountered'),
      next_steps: z.array(z.string()).optional().describe('Suggested next steps'),
    },
    async ({ card_number, summary, changes, blockers, next_steps }) => {
      // Build progress report body
      const parts: string[] = [];

      parts.push(`## Progress Report`);
      parts.push('');
      parts.push(summary);

      if (changes && changes.length > 0) {
        parts.push('');
        parts.push('### Changes Made');
        for (const change of changes) {
          parts.push(`- ${change}`);
        }
      }

      if (blockers && blockers.length > 0) {
        parts.push('');
        parts.push('### Blockers');
        for (const blocker of blockers) {
          parts.push(`- ${blocker}`);
        }
      }

      if (next_steps && next_steps.length > 0) {
        parts.push('');
        parts.push('### Next Steps');
        for (const step of next_steps) {
          parts.push(`- ${step}`);
        }
      }

      parts.push('');
      parts.push(`---`);
      parts.push(`*Reported by AI Assistant at ${new Date().toISOString()}*`);

      const body = parts.join('\n');

      return wrapToolOperation(
        () => client.comments.create(card_number, { body }),
        () => `Progress reported on card #${card_number}`,
      );
    },
  );

  // Start Work Session
  server.tool(
    'fizzy_pm_start_session',
    `Start a tracked work session on a card.
This marks the card as being actively worked on by:
- Adding a "session started" comment
- Optionally assigning the card to the current user

Use this before beginning substantial work on a card.`,
    {
      card_number: z.number().describe('The card number to work on'),
      assign_to_self: z.boolean().optional().default(true).describe('Assign the card to yourself'),
      goal: z.string().optional().describe('What you aim to accomplish in this session'),
    },
    async ({ card_number, assign_to_self, goal }) => {
      // Get current user
      const identityResult = await client.identity.getIdentity();
      if (!identityResult.ok) {
        return formatToolError(identityResult.error);
      }

      // Get the user ID from the first account
      const account = identityResult.value.accounts[0];
      if (!account) {
        return formatToolError({
          code: 'CONFIG_ERROR',
          message: 'No accounts found',
          retryable: false,
        } as never);
      }
      const userId = account.user.id;

      // Optionally assign to self
      if (assign_to_self) {
        const assignResult = await client.cards.toggleAssignment(card_number, userId);
        if (!assignResult.ok && assignResult.error.code !== 'VALIDATION_ERROR') {
          // Ignore if already assigned
          return formatToolError(assignResult.error);
        }
      }

      // Add session start comment
      const parts: string[] = [];
      parts.push(`## Work Session Started`);
      parts.push('');
      if (goal) {
        parts.push(`**Goal:** ${goal}`);
        parts.push('');
      }
      parts.push(`*Session started at ${new Date().toISOString()}*`);

      const body = parts.join('\n');

      const commentResult = await client.comments.create(card_number, { body });
      if (!commentResult.ok) {
        return formatToolError(commentResult.error);
      }

      return formatToolSuccess(
        {
          card_number,
          session_started: new Date().toISOString(),
          goal,
          assigned: assign_to_self,
        },
        `Work session started on card #${card_number}`,
      );
    },
  );

  // End Work Session
  server.tool(
    'fizzy_pm_end_session',
    `End a work session on a card with a summary.
This wraps up the session by:
- Adding a summary comment with what was accomplished
- Optionally marking steps as complete
- Optionally closing the card if work is done

Use this after completing work on a card.`,
    {
      card_number: z.number().describe('The card number'),
      summary: z.string().describe('Summary of what was accomplished'),
      completed_steps: z.array(z.string()).optional().describe('IDs of steps to mark complete'),
      close_card: z.boolean().optional().default(false).describe('Close the card if work is done'),
    },
    async ({ card_number, summary, completed_steps, close_card }) => {
      // Mark steps complete if specified
      if (completed_steps && completed_steps.length > 0) {
        for (const stepId of completed_steps) {
          const stepResult = await client.steps.update(card_number, stepId, { completed: true });
          if (!stepResult.ok) {
            // Log but continue
            console.error(`Failed to complete step ${stepId}:`, stepResult.error);
          }
        }
      }

      // Add session end comment
      const parts: string[] = [];
      parts.push(`## Work Session Completed`);
      parts.push('');
      parts.push(summary);
      parts.push('');
      if (completed_steps && completed_steps.length > 0) {
        parts.push(`**Steps completed:** ${completed_steps.length}`);
        parts.push('');
      }
      parts.push(`*Session ended at ${new Date().toISOString()}*`);

      const body = parts.join('\n');

      const commentResult = await client.comments.create(card_number, { body });
      if (!commentResult.ok) {
        return formatToolError(commentResult.error);
      }

      // Close card if requested
      if (close_card) {
        const closeResult = await client.cards.close(card_number);
        if (!closeResult.ok) {
          return formatToolError(closeResult.error);
        }
      }

      return formatToolSuccess(
        {
          card_number,
          session_ended: new Date().toISOString(),
          steps_completed: completed_steps?.length ?? 0,
          card_closed: close_card,
        },
        `Work session ended on card #${card_number}${close_card ? ' (card closed)' : ''}`,
      );
    },
  );
}
