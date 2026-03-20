/**
 * Work Dispatcher
 *
 * Stores pending work items in Cloudflare KV for later retrieval
 * by AI agents via MCP tools.
 */

import type { Env } from '../types';
import {
  pendingWorkKey,
  generateWorkId,
  type PendingWork,
  type WorkTrigger,
  type WorkMode,
} from '@fizzy-do-mcp/shared';

/**
 * Result of dispatching work.
 */
export interface DispatchResult {
  /** Whether the dispatch was successful */
  success: boolean;
  /** Error message if dispatch failed */
  error?: string;
  /** The work item ID if created */
  work_id?: string;
}

/**
 * Card data from webhook payload.
 */
export interface WebhookCardData {
  number: number;
  title: string;
  board_id: string;
  board_name: string;
  column_name: string | null;
}

/**
 * Dispatch work to the pending work queue (KV).
 *
 * This function stores a pending work item in KV for later retrieval
 * by AI agents via MCP tools.
 *
 * @param env - Cloudflare environment bindings
 * @param accountSlug - Account slug
 * @param card - Card data
 * @param mode - Work mode (code or plan)
 * @param trigger - What triggered this work
 * @param metadata - Optional metadata
 * @returns Dispatch result
 */
export async function dispatchWork(
  env: Env,
  accountSlug: string,
  card: WebhookCardData,
  mode: WorkMode,
  trigger: WorkTrigger,
  metadata?: { triggered_by_user?: string; webhook_event_id?: string },
): Promise<DispatchResult> {
  try {
    const kv = env.PENDING_WORK;
    const key = pendingWorkKey(accountSlug, card.number);
    const now = new Date();
    const workId = generateWorkId(accountSlug, card.number, now);

    // Check if work already exists for this card
    const existing = await kv.get(key, 'json');
    if (existing) {
      const existingWork = existing as PendingWork;
      // If already pending or claimed, don't create duplicate
      if (existingWork.status === 'pending' || existingWork.status === 'claimed') {
        return {
          success: false,
          error: `Work already exists for card ${card.number} (status: ${existingWork.status})`,
        };
      }
    }

    // Create new pending work item
    const work: PendingWork = {
      id: workId,
      account_slug: accountSlug,
      card_number: card.number,
      card_title: card.title,
      board_id: card.board_id,
      board_name: card.board_name,
      mode,
      status: 'pending',
      trigger,
      column_name: card.column_name,
      created_at: now.toISOString(),
      claimed_at: null,
      claimed_by: null,
      completed_at: null,
      error: null,
      metadata,
    };

    // Store in KV
    await kv.put(key, JSON.stringify(work));

    console.log(`Pending work created: ${workId} for card ${card.number}`);

    return {
      success: true,
      work_id: workId,
    };
  } catch (error) {
    console.error('dispatchWork error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Cancel pending work for a card.
 *
 * This updates the work item status to 'abandoned' if it exists and is pending.
 *
 * @param env - Cloudflare environment bindings
 * @param accountSlug - Account slug
 * @param cardNumber - Card number
 * @param reason - Reason for cancellation
 */
export async function cancelWork(
  env: Env,
  accountSlug: string,
  cardNumber: number,
  reason: string,
): Promise<void> {
  try {
    const kv = env.PENDING_WORK;
    const key = pendingWorkKey(accountSlug, cardNumber);

    const existing = await kv.get(key, 'json');
    if (!existing) {
      return; // No work to cancel
    }

    const work = existing as PendingWork;

    // Only cancel if pending (not if already claimed/completed)
    if (work.status === 'pending') {
      const updated: PendingWork = {
        ...work,
        status: 'abandoned',
        error: `Cancelled: ${reason}`,
      };

      await kv.put(key, JSON.stringify(updated));
      console.log(`Pending work cancelled: ${work.id} for card ${cardNumber} (${reason})`);
    }
  } catch (error) {
    console.error('cancelWork error:', error);
  }
}
