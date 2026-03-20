import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { FizzyClient } from '@fizzy-do-mcp/client';
import type { PendingWork, WorkStatus } from '@fizzy-do-mcp/shared';
import { formatToolSuccess, formatToolError } from '../utils.js';

/**
 * Hosted worker base URL.
 * In production, this should be configurable.
 */
const HOSTED_URL = process.env.FIZZY_HOSTED_URL ?? 'https://mcp.fizzy.yogan.dev';

/**
 * Make a request to the hosted pending work API.
 */
async function pendingWorkRequest<T>(
  client: FizzyClient,
  method: 'GET' | 'POST',
  path: string,
  body?: unknown,
): Promise<{ ok: true; data: T } | { ok: false; error: string; status: number }> {
  const url = `${HOSTED_URL}/pending-work${path}`;

  const init: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-Fizzy-Token': client.token,
      'X-Fizzy-Account-Slug': client.accountSlug,
    },
  };

  if (body) {
    init.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, init);

    const data = (await response.json()) as T | { error: string; message: string };

    if (!response.ok) {
      const errorData = data as { error: string; message: string };
      return {
        ok: false,
        error: errorData.message || errorData.error || 'Unknown error',
        status: response.status,
      };
    }

    return { ok: true, data: data as T };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Network error',
      status: 0,
    };
  }
}

/**
 * Registers Pending Work tools with the MCP server.
 *
 * These tools enable AI agents to query and manage the work queue:
 * - List pending work items
 * - Claim work items
 * - Complete work items
 * - Abandon work items
 */
export function registerPendingWorkTools(server: McpServer, client: FizzyClient): void {
  // List Pending Work
  server.tool(
    'fizzy_pending_work_list',
    `List pending work items in the AI work queue.

Returns work items that have been queued via webhooks when cards are
moved to trigger columns or tagged with AI work tags.

Filter by status to see:
- pending: Work waiting to be claimed (default)
- claimed: Work currently being processed
- completed: Successfully completed work
- failed: Work that failed
- abandoned: Work that was abandoned`,
    {
      status: z
        .enum(['pending', 'claimed', 'completed', 'failed', 'abandoned'])
        .optional()
        .describe('Filter by status (default: pending)'),
      board_id: z.string().optional().describe('Filter by board ID'),
      mode: z.enum(['code', 'plan']).optional().describe('Filter by work mode (code or plan)'),
      limit: z
        .number()
        .min(1)
        .max(100)
        .optional()
        .describe('Maximum number of items to return (default: 10)'),
    },
    async ({ status, board_id, mode, limit }) => {
      const params = new URLSearchParams();
      if (status) params.set('status', status);
      if (board_id) params.set('board_id', board_id);
      if (mode) params.set('mode', mode);
      if (limit) params.set('limit', limit.toString());

      const queryString = params.toString();
      const path = queryString ? `?${queryString}` : '';

      const result = await pendingWorkRequest<{
        items: PendingWork[];
        count: number;
        account_slug: string;
      }>(client, 'GET', path);

      if (!result.ok) {
        return formatToolError({
          code: 'API_ERROR',
          message: result.error,
          retryable: result.status >= 500,
        } as never);
      }

      const { items, count } = result.data;

      if (count === 0) {
        return formatToolSuccess(
          { items: [], count: 0 },
          `No ${status || 'pending'} work items found`,
        );
      }

      // Format items for display
      const formatted = items.map((item) => ({
        id: item.id,
        card_number: item.card_number,
        card_title: item.card_title,
        board_name: item.board_name,
        mode: item.mode,
        status: item.status,
        trigger: item.trigger,
        created_at: item.created_at,
        claimed_by: item.claimed_by,
      }));

      return formatToolSuccess(
        { items: formatted, count },
        `Found ${count} ${status || 'pending'} work item(s)`,
      );
    },
  );

  // Get Work Item Details
  server.tool(
    'fizzy_pending_work_get',
    `Get detailed information about a specific work item.

Use this to see the full details of a work item including
metadata, timestamps, and error information.`,
    {
      work_id: z.string().describe('The work item ID'),
    },
    async ({ work_id }) => {
      const result = await pendingWorkRequest<PendingWork>(client, 'GET', `/${work_id}`);

      if (!result.ok) {
        if (result.status === 404) {
          return formatToolError({
            code: 'NOT_FOUND',
            message: 'Work item not found',
            retryable: false,
          } as never);
        }
        return formatToolError({
          code: 'API_ERROR',
          message: result.error,
          retryable: result.status >= 500,
        } as never);
      }

      return formatToolSuccess(result.data, `Work item ${work_id}: ${result.data.card_title}`);
    },
  );

  // Claim Work
  server.tool(
    'fizzy_pending_work_claim',
    `Claim a pending work item to start working on it.

This marks the work item as claimed by your agent, preventing
other agents from picking it up. You should claim work before
starting to process a card.

After claiming, use the regular Fizzy card tools to:
1. Get full card details with fizzy_get_card
2. Process the work (code or plan based on mode)
3. Mark complete with fizzy_pending_work_complete`,
    {
      work_id: z.string().describe('The work item ID to claim'),
      agent_id: z.string().optional().describe('Agent identifier (default: auto-generated)'),
    },
    async ({ work_id, agent_id }) => {
      const agentIdentifier = agent_id ?? `claude-${Date.now().toString(36)}`;

      const result = await pendingWorkRequest<PendingWork>(client, 'POST', '/claim', {
        work_id,
        agent_id: agentIdentifier,
      });

      if (!result.ok) {
        if (result.status === 404) {
          return formatToolError({
            code: 'NOT_FOUND',
            message: 'Work item not found',
            retryable: false,
          } as never);
        }
        if (result.status === 409) {
          return formatToolError({
            code: 'CONFLICT',
            message: result.error,
            retryable: false,
          } as never);
        }
        return formatToolError({
          code: 'API_ERROR',
          message: result.error,
          retryable: result.status >= 500,
        } as never);
      }

      const item = result.data;

      return formatToolSuccess(
        {
          work_id: item.id,
          card_number: item.card_number,
          card_title: item.card_title,
          board_id: item.board_id,
          mode: item.mode,
          claimed_by: item.claimed_by,
          next_steps: [
            `Get card details: fizzy_get_card with card_number=${item.card_number}`,
            item.mode === 'code'
              ? 'Implement the requested changes and create a PR'
              : 'Break down the card into steps and add implementation notes',
            'Mark complete: fizzy_pending_work_complete',
          ],
        },
        `Claimed work item: ${item.card_title}`,
      );
    },
  );

  // Complete Work
  server.tool(
    'fizzy_pending_work_complete',
    `Mark a claimed work item as completed or failed.

Call this after you have finished processing a card to update
the work queue. This helps track what has been done and allows
the system to clean up completed items.`,
    {
      work_id: z.string().describe('The work item ID'),
      success: z.boolean().describe('Whether the work completed successfully'),
      error: z.string().optional().describe('Error message if failed'),
    },
    async ({ work_id, success, error }) => {
      const result = await pendingWorkRequest<PendingWork>(client, 'POST', '/complete', {
        work_id,
        success,
        error,
      });

      if (!result.ok) {
        if (result.status === 404) {
          return formatToolError({
            code: 'NOT_FOUND',
            message: 'Work item not found',
            retryable: false,
          } as never);
        }
        if (result.status === 409) {
          return formatToolError({
            code: 'CONFLICT',
            message: result.error,
            retryable: false,
          } as never);
        }
        return formatToolError({
          code: 'API_ERROR',
          message: result.error,
          retryable: result.status >= 500,
        } as never);
      }

      const item = result.data;

      return formatToolSuccess(
        {
          work_id: item.id,
          card_number: item.card_number,
          status: item.status,
          completed_at: item.completed_at,
        },
        success
          ? `Completed work item: ${item.card_title}`
          : `Marked work item as failed: ${item.card_title}`,
      );
    },
  );

  // Abandon Work
  server.tool(
    'fizzy_pending_work_abandon',
    `Abandon a claimed work item.

Use this if you cannot complete a work item and want to
release it so another agent can pick it up. The item will
be marked as abandoned.`,
    {
      work_id: z.string().describe('The work item ID to abandon'),
    },
    async ({ work_id }) => {
      const result = await pendingWorkRequest<PendingWork>(client, 'POST', '/abandon', { work_id });

      if (!result.ok) {
        if (result.status === 404) {
          return formatToolError({
            code: 'NOT_FOUND',
            message: 'Work item not found',
            retryable: false,
          } as never);
        }
        if (result.status === 409) {
          return formatToolError({
            code: 'CONFLICT',
            message: result.error,
            retryable: false,
          } as never);
        }
        return formatToolError({
          code: 'API_ERROR',
          message: result.error,
          retryable: result.status >= 500,
        } as never);
      }

      const item = result.data;

      return formatToolSuccess(
        {
          work_id: item.id,
          card_number: item.card_number,
          status: item.status,
        },
        `Abandoned work item: ${item.card_title}`,
      );
    },
  );

  // Check Work Status
  server.tool(
    'fizzy_pending_work_status',
    `Get a summary of the pending work queue status.

Returns counts of work items by status, useful for understanding
the overall state of the AI work queue.`,
    {},
    async () => {
      // Fetch items in different statuses
      const statuses: WorkStatus[] = ['pending', 'claimed', 'completed', 'failed', 'abandoned'];
      const counts: Record<string, number> = {};

      for (const status of statuses) {
        const result = await pendingWorkRequest<{
          items: PendingWork[];
          count: number;
        }>(client, 'GET', `?status=${status}&limit=1`);

        if (result.ok) {
          // We need to get actual count - for now use what we get
          // In a real implementation, the API should return total count
          counts[status] = result.data.count;
        } else {
          counts[status] = 0;
        }
      }

      const total = Object.values(counts).reduce((a, b) => a + b, 0);
      const pendingCount = counts['pending'] ?? 0;

      return formatToolSuccess(
        {
          counts,
          total,
          has_pending_work: pendingCount > 0,
        },
        pendingCount > 0 ? `${pendingCount} work item(s) pending` : 'No pending work items',
      );
    },
  );
}
