/**
 * Work Dispatcher
 *
 * Routes incoming webhook events to connected sessions via Durable Objects.
 * Handles card lock acquisition and work queue management.
 */

import type { Env } from '../types';
import type { CardWorkItem, VibeConfig, ServerMessage } from '@fizzy-do-mcp/shared';
import { serverMessage } from '@fizzy-do-mcp/shared';

/**
 * Result of dispatching work to a session.
 */
export interface DispatchResult {
  /** Whether the dispatch was successful */
  success: boolean;
  /** Error message if dispatch failed */
  error?: string;
  /** Queue position if enqueued */
  position?: number;
  /** Whether a session was immediately notified */
  notified?: boolean;
}

/**
 * Dispatch work to a connected session or enqueue for later.
 *
 * This function:
 * 1. Looks up the SessionRegistry for the account
 * 2. Checks if a session is connected for the board
 * 3. Acquires a card lock via CardLock DO
 * 4. Enqueues the card in WorkQueue DO
 * 5. Notifies the connected session (if any)
 *
 * @param env - Cloudflare environment bindings
 * @param accountSlug - Account slug for the board
 * @param boardId - Board ID to dispatch work to
 * @param card - Card work item to process
 * @param mode - AI work mode (ai-code or ai-plan)
 * @param config - Board's vibe configuration
 * @returns Dispatch result
 */
export async function dispatchWork(
  env: Env,
  accountSlug: string,
  boardId: string,
  card: CardWorkItem,
  mode: 'ai-code' | 'ai-plan',
  config: VibeConfig,
): Promise<DispatchResult> {
  try {
    // Step 1: Check if card is already locked
    const lockId = env.CARD_LOCK.idFromName('global');
    const lock = env.CARD_LOCK.get(lockId);

    const lockCheckResponse = await lock.fetch(`https://internal/check?cardNumber=${card.number}`);
    const lockCheck = (await lockCheckResponse.json()) as { locked: boolean };

    if (lockCheck.locked) {
      return {
        success: false,
        error: `Card ${card.number} is already locked by another session`,
      };
    }

    // Step 2: Enqueue the work
    const queueId = env.WORK_QUEUE.idFromName(boardId);
    const queue = env.WORK_QUEUE.get(queueId);

    const enqueueResponse = await queue.fetch('https://internal/enqueue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        card,
        mode,
        config,
        priority: 100, // Default priority
      }),
    });

    if (!enqueueResponse.ok) {
      const errorData = (await enqueueResponse.json()) as { error?: string };
      return {
        success: false,
        error: errorData.error ?? 'Failed to enqueue work',
      };
    }

    const enqueueResult = (await enqueueResponse.json()) as {
      position: number;
      depth: number;
    };

    // Step 3: Check for connected session and notify
    const registryId = env.SESSION_REGISTRY.idFromName(accountSlug);
    const registry = env.SESSION_REGISTRY.get(registryId);

    const sessionsResponse = await registry.fetch('https://internal/sessions');
    const sessionsData = (await sessionsResponse.json()) as {
      sessions: Array<{ boardId: string; sessionId: string }>;
    };

    // Find session for this board
    const session = sessionsData.sessions.find((s) => s.boardId === boardId);

    if (session) {
      // Notify the session about new work in queue
      const queueStatusMessage: ServerMessage = serverMessage({
        type: 'queue_status',
        cards_waiting: enqueueResult.depth,
      });

      await registry.fetch('https://internal/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          boardId,
          message: queueStatusMessage,
        }),
      });

      return {
        success: true,
        position: enqueueResult.position,
        notified: true,
      };
    }

    // No active session, work is queued for when one connects
    return {
      success: true,
      position: enqueueResult.position,
      notified: false,
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
 * Cancel work for a card (e.g., when card is closed or moved out of Accepted).
 *
 * @param env - Cloudflare environment bindings
 * @param accountSlug - Account slug for the board
 * @param boardId - Board ID
 * @param cardNumber - Card number to cancel
 * @param reason - Reason for cancellation
 */
export async function cancelWork(
  env: Env,
  accountSlug: string,
  boardId: string,
  cardNumber: number,
  reason: string,
): Promise<void> {
  try {
    // Remove from queue if present
    const queueId = env.WORK_QUEUE.idFromName(boardId);
    const queue = env.WORK_QUEUE.get(queueId);

    await queue.fetch('https://internal/remove', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cardNumber }),
    });

    // Notify connected session about cancellation
    const registryId = env.SESSION_REGISTRY.idFromName(accountSlug);
    const registry = env.SESSION_REGISTRY.get(registryId);

    const cancelMessage: ServerMessage = serverMessage({
      type: 'work_cancelled',
      card_number: cardNumber,
      reason,
    });

    await registry.fetch('https://internal/broadcast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        boardId,
        message: cancelMessage,
      }),
    });

    // Release any locks on the card
    const lockId = env.CARD_LOCK.idFromName('global');
    const lock = env.CARD_LOCK.get(lockId);

    // Get the current owner to release properly
    const ownerResponse = await lock.fetch(`https://internal/owner?cardNumber=${cardNumber}`);
    const ownerData = (await ownerResponse.json()) as { owner: string | null };

    if (ownerData.owner) {
      await lock.fetch('https://internal/release', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardNumber,
          sessionId: ownerData.owner,
        }),
      });
    }
  } catch (error) {
    console.error('cancelWork error:', error);
  }
}

/**
 * Get the current queue status for a board.
 *
 * @param env - Cloudflare environment bindings
 * @param boardId - Board ID to check
 * @returns Queue status information
 */
export async function getQueueStatus(
  env: Env,
  boardId: string,
): Promise<{
  depth: number;
  items: Array<{ cardNumber: number; cardTitle: string; mode: string }>;
}> {
  const queueId = env.WORK_QUEUE.idFromName(boardId);
  const queue = env.WORK_QUEUE.get(queueId);

  const response = await queue.fetch('https://internal/status');
  return response.json() as Promise<{
    depth: number;
    items: Array<{ cardNumber: number; cardTitle: string; mode: string }>;
  }>;
}
