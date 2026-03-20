/**
 * Pending Work API Handler
 *
 * Manages the AI work queue stored in Cloudflare KV.
 * Provides endpoints for listing, claiming, completing, and abandoning work.
 *
 * Routes:
 *   GET    /pending-work         - List pending work items
 *   POST   /pending-work/claim   - Claim a work item
 *   POST   /pending-work/complete - Complete a work item
 *   POST   /pending-work/abandon  - Abandon a claimed work item
 */

import type { Context } from 'hono';
import { Hono } from 'hono';
import type { HonoEnv } from '../types';
import {
  PendingWorkSchema,
  ListPendingWorkFilterSchema,
  ClaimWorkInputSchema,
  CompleteWorkInputSchema,
  type PendingWork,
  type WorkStatus,
} from '@fizzy-do-mcp/shared';

/**
 * Pending work routes for AI work queue management.
 */
export const pendingWorkRoutes = new Hono<HonoEnv>();

/**
 * Extract account slug from request headers.
 * For now, we trust the header - in production, validate against Fizzy API.
 */
function getAccountSlug(c: Context<HonoEnv>): string | null {
  const slug = c.req.header('X-Fizzy-Account-Slug');
  if (!slug) return null;

  // Normalize: ensure it starts with /
  return slug.startsWith('/') ? slug : `/${slug}`;
}

/**
 * List all pending work keys for an account.
 * KV list returns keys matching a prefix.
 */
async function listWorkKeys(
  kv: KVNamespace,
  accountSlug: string,
  _status?: WorkStatus,
): Promise<string[]> {
  const prefix = `${accountSlug}:`;
  const result = await kv.list({ prefix });

  // If filtering by status, we need to fetch each item
  // For now, return all keys - filtering happens after fetch
  return result.keys.map((k) => k.name);
}

/**
 * GET /pending-work
 *
 * List pending work items for the authenticated account.
 */
pendingWorkRoutes.get('/', async (c) => {
  const accountSlug = getAccountSlug(c);
  if (!accountSlug) {
    return c.json(
      { error: 'missing_account', message: 'X-Fizzy-Account-Slug header is required' },
      400,
    );
  }

  const kv = c.env.PENDING_WORK;

  // Parse query params
  const query = c.req.query();
  const filterResult = ListPendingWorkFilterSchema.safeParse({
    status: query.status || 'pending',
    board_id: query.board_id,
    mode: query.mode,
    limit: query.limit ? parseInt(query.limit, 10) : 10,
  });

  if (!filterResult.success) {
    return c.json({ error: 'validation_error', message: 'Invalid query parameters' }, 400);
  }

  const filter = filterResult.data;

  // Get all work items for this account
  const keys = await listWorkKeys(kv, accountSlug);
  const items: PendingWork[] = [];

  for (const key of keys) {
    if (items.length >= filter.limit) break;

    const raw = await kv.get(key, 'json');
    if (!raw) continue;

    const parsed = PendingWorkSchema.safeParse(raw);
    if (!parsed.success) continue;

    const item = parsed.data;

    // Apply filters
    if (filter.status && item.status !== filter.status) continue;
    if (filter.board_id && item.board_id !== filter.board_id) continue;
    if (filter.mode && item.mode !== filter.mode) continue;

    items.push(item);
  }

  return c.json({
    items,
    count: items.length,
    account_slug: accountSlug,
  });
});

/**
 * GET /pending-work/:id
 *
 * Get a specific work item by ID.
 */
pendingWorkRoutes.get('/:id', async (c) => {
  const accountSlug = getAccountSlug(c);
  if (!accountSlug) {
    return c.json(
      { error: 'missing_account', message: 'X-Fizzy-Account-Slug header is required' },
      400,
    );
  }

  const workId = c.req.param('id');
  const kv = c.env.PENDING_WORK;

  // Search for the work item (we need to find it by ID, not key)
  const keys = await listWorkKeys(kv, accountSlug);

  for (const key of keys) {
    const raw = await kv.get(key, 'json');
    if (!raw) continue;

    const parsed = PendingWorkSchema.safeParse(raw);
    if (!parsed.success) continue;

    if (parsed.data.id === workId) {
      return c.json(parsed.data);
    }
  }

  return c.json({ error: 'not_found', message: 'Work item not found' }, 404);
});

/**
 * POST /pending-work/claim
 *
 * Claim a pending work item.
 */
pendingWorkRoutes.post('/claim', async (c) => {
  const accountSlug = getAccountSlug(c);
  if (!accountSlug) {
    return c.json(
      { error: 'missing_account', message: 'X-Fizzy-Account-Slug header is required' },
      400,
    );
  }

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'invalid_json', message: 'Request body must be valid JSON' }, 400);
  }

  const parseResult = ClaimWorkInputSchema.safeParse(body);
  if (!parseResult.success) {
    return c.json(
      {
        error: 'validation_error',
        message: 'Invalid request body',
        details: parseResult.error.format(),
      },
      400,
    );
  }

  const { work_id, agent_id } = parseResult.data;
  const kv = c.env.PENDING_WORK;

  // Find the work item
  const keys = await listWorkKeys(kv, accountSlug);
  let foundKey: string | null = null;
  let foundItem: PendingWork | null = null;

  for (const key of keys) {
    const raw = await kv.get(key, 'json');
    if (!raw) continue;

    const parsed = PendingWorkSchema.safeParse(raw);
    if (!parsed.success) continue;

    if (parsed.data.id === work_id) {
      foundKey = key;
      foundItem = parsed.data;
      break;
    }
  }

  if (!foundKey || !foundItem) {
    return c.json({ error: 'not_found', message: 'Work item not found' }, 404);
  }

  // Check if already claimed
  if (foundItem.status !== 'pending') {
    return c.json(
      {
        error: 'already_claimed',
        message: `Work item is already ${foundItem.status}`,
        claimed_by: foundItem.claimed_by,
      },
      409,
    );
  }

  // Claim the work item
  const now = new Date().toISOString();
  const updated: PendingWork = {
    ...foundItem,
    status: 'claimed',
    claimed_at: now,
    claimed_by: agent_id,
  };

  await kv.put(foundKey, JSON.stringify(updated));

  console.log(`Work item ${work_id} claimed by agent ${agent_id}`);

  return c.json(updated);
});

/**
 * POST /pending-work/complete
 *
 * Mark a work item as completed or failed.
 */
pendingWorkRoutes.post('/complete', async (c) => {
  const accountSlug = getAccountSlug(c);
  if (!accountSlug) {
    return c.json(
      { error: 'missing_account', message: 'X-Fizzy-Account-Slug header is required' },
      400,
    );
  }

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'invalid_json', message: 'Request body must be valid JSON' }, 400);
  }

  const parseResult = CompleteWorkInputSchema.safeParse(body);
  if (!parseResult.success) {
    return c.json(
      {
        error: 'validation_error',
        message: 'Invalid request body',
        details: parseResult.error.format(),
      },
      400,
    );
  }

  const { work_id, success, error } = parseResult.data;
  const kv = c.env.PENDING_WORK;

  // Find the work item
  const keys = await listWorkKeys(kv, accountSlug);
  let foundKey: string | null = null;
  let foundItem: PendingWork | null = null;

  for (const key of keys) {
    const raw = await kv.get(key, 'json');
    if (!raw) continue;

    const parsed = PendingWorkSchema.safeParse(raw);
    if (!parsed.success) continue;

    if (parsed.data.id === work_id) {
      foundKey = key;
      foundItem = parsed.data;
      break;
    }
  }

  if (!foundKey || !foundItem) {
    return c.json({ error: 'not_found', message: 'Work item not found' }, 404);
  }

  // Check if claimed
  if (foundItem.status !== 'claimed') {
    return c.json(
      { error: 'not_claimed', message: 'Work item must be claimed before completing' },
      409,
    );
  }

  // Complete the work item
  const now = new Date().toISOString();
  const updated: PendingWork = {
    ...foundItem,
    status: success ? 'completed' : 'failed',
    completed_at: now,
    error: error ?? null,
  };

  await kv.put(foundKey, JSON.stringify(updated));

  console.log(`Work item ${work_id} ${success ? 'completed' : 'failed'}`);

  return c.json(updated);
});

/**
 * POST /pending-work/abandon
 *
 * Abandon a claimed work item, returning it to pending status.
 */
pendingWorkRoutes.post('/abandon', async (c) => {
  const accountSlug = getAccountSlug(c);
  if (!accountSlug) {
    return c.json(
      { error: 'missing_account', message: 'X-Fizzy-Account-Slug header is required' },
      400,
    );
  }

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'invalid_json', message: 'Request body must be valid JSON' }, 400);
  }

  // Just need work_id for abandon
  const { work_id } = body as { work_id?: string };
  if (!work_id || typeof work_id !== 'string') {
    return c.json({ error: 'validation_error', message: 'work_id is required' }, 400);
  }

  const kv = c.env.PENDING_WORK;

  // Find the work item
  const keys = await listWorkKeys(kv, accountSlug);
  let foundKey: string | null = null;
  let foundItem: PendingWork | null = null;

  for (const key of keys) {
    const raw = await kv.get(key, 'json');
    if (!raw) continue;

    const parsed = PendingWorkSchema.safeParse(raw);
    if (!parsed.success) continue;

    if (parsed.data.id === work_id) {
      foundKey = key;
      foundItem = parsed.data;
      break;
    }
  }

  if (!foundKey || !foundItem) {
    return c.json({ error: 'not_found', message: 'Work item not found' }, 404);
  }

  // Check if claimed
  if (foundItem.status !== 'claimed') {
    return c.json(
      { error: 'not_claimed', message: 'Only claimed work items can be abandoned' },
      409,
    );
  }

  // Reset to pending
  const updated: PendingWork = {
    ...foundItem,
    status: 'abandoned',
    claimed_at: null,
    claimed_by: null,
  };

  await kv.put(foundKey, JSON.stringify(updated));

  console.log(`Work item ${work_id} abandoned`);

  return c.json(updated);
});
