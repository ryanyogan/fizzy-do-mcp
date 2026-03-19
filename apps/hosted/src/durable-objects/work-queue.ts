/**
 * Work Queue Durable Object
 *
 * FIFO queue of cards ready for AI work. One instance per board,
 * keyed by board_id.
 *
 * Responsibilities:
 * - Maintain ordered queue of cards ready for work
 * - Provide FIFO dequeue semantics
 * - Track queue depth and status
 */

import { DurableObject } from 'cloudflare:workers';
import type { Env } from '../types';
import type { CardWorkItem, VibeConfig } from '@fizzy-do-mcp/shared';

/**
 * Queue item with additional metadata
 */
interface QueueItem {
  /** The card work item */
  card: CardWorkItem;
  /** AI work mode */
  mode: 'ai-code' | 'ai-plan';
  /** Board's vibe config */
  config: VibeConfig;
  /** When the card was enqueued */
  enqueuedAt: number;
  /** Priority (lower = higher priority) */
  priority: number;
}

/**
 * Work Queue Durable Object
 *
 * Manages the queue of cards waiting for AI work on a board.
 */
export class WorkQueue extends DurableObject<Env> {
  /** The queue of work items */
  private queue: QueueItem[] = [];

  /** Storage key for persisting the queue */
  private static readonly STORAGE_KEY = 'queue';

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);

    // Load queue from storage on startup
    void this.ctx.blockConcurrencyWhile(async () => {
      const stored = await this.ctx.storage.get<QueueItem[]>(WorkQueue.STORAGE_KEY);
      if (stored) {
        this.queue = stored;
      }
    });
  }

  /**
   * Persist the queue to storage
   */
  private async saveQueue(): Promise<void> {
    await this.ctx.storage.put(WorkQueue.STORAGE_KEY, this.queue);
  }

  /**
   * Handle incoming fetch requests
   */
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    switch (url.pathname) {
      case '/enqueue':
        return this.handleEnqueue(request);
      case '/dequeue':
        return this.handleDequeue();
      case '/peek':
        return this.handlePeek();
      case '/remove':
        return this.handleRemove(request);
      case '/status':
        return this.handleStatus();
      case '/clear':
        return this.handleClear();
      default:
        return new Response('Not found', { status: 404 });
    }
  }

  /**
   * Handle enqueue request
   */
  private async handleEnqueue(request: Request): Promise<Response> {
    try {
      const body = (await request.json()) as {
        card: CardWorkItem;
        mode: 'ai-code' | 'ai-plan';
        config: VibeConfig;
        priority?: number;
      };

      const item: QueueItem = {
        card: body.card,
        mode: body.mode,
        config: body.config,
        enqueuedAt: Date.now(),
        priority: body.priority ?? 100,
      };

      // Insert in priority order (lower priority number = higher priority)
      const insertIndex = this.queue.findIndex((q) => q.priority > item.priority);
      if (insertIndex === -1) {
        this.queue.push(item);
      } else {
        this.queue.splice(insertIndex, 0, item);
      }

      await this.saveQueue();

      return new Response(
        JSON.stringify({
          success: true,
          position: insertIndex === -1 ? this.queue.length : insertIndex + 1,
          depth: this.queue.length,
        }),
        { headers: { 'Content-Type': 'application/json' } },
      );
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: 'enqueue_failed',
          message: error instanceof Error ? error.message : 'Unknown error',
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      );
    }
  }

  /**
   * Handle dequeue request
   */
  private async handleDequeue(): Promise<Response> {
    const item = this.queue.shift();

    if (!item) {
      return new Response(JSON.stringify({ card: null, depth: 0 }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await this.saveQueue();

    return new Response(
      JSON.stringify({
        card: item.card,
        mode: item.mode,
        config: item.config,
        depth: this.queue.length,
      }),
      { headers: { 'Content-Type': 'application/json' } },
    );
  }

  /**
   * Handle peek request
   */
  private handlePeek(): Response {
    const item = this.queue[0];

    if (!item) {
      return new Response(JSON.stringify({ card: null, depth: 0 }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({
        card: item.card,
        mode: item.mode,
        config: item.config,
        depth: this.queue.length,
      }),
      { headers: { 'Content-Type': 'application/json' } },
    );
  }

  /**
   * Handle remove request
   */
  private async handleRemove(request: Request): Promise<Response> {
    try {
      const body = (await request.json()) as { cardNumber: number };
      const { cardNumber } = body;

      const index = this.queue.findIndex((q) => q.card.number === cardNumber);

      if (index === -1) {
        return new Response(
          JSON.stringify({
            success: false,
            message: `Card ${cardNumber} not found in queue`,
          }),
          { headers: { 'Content-Type': 'application/json' } },
        );
      }

      this.queue.splice(index, 1);
      await this.saveQueue();

      return new Response(
        JSON.stringify({
          success: true,
          depth: this.queue.length,
        }),
        { headers: { 'Content-Type': 'application/json' } },
      );
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: 'remove_failed',
          message: error instanceof Error ? error.message : 'Unknown error',
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      );
    }
  }

  /**
   * Handle status request
   */
  private handleStatus(): Response {
    return new Response(
      JSON.stringify({
        depth: this.queue.length,
        items: this.queue.map((q, index) => ({
          position: index + 1,
          cardNumber: q.card.number,
          cardTitle: q.card.title,
          mode: q.mode,
          priority: q.priority,
          enqueuedAt: q.enqueuedAt,
        })),
      }),
      { headers: { 'Content-Type': 'application/json' } },
    );
  }

  /**
   * Handle clear request
   */
  private async handleClear(): Promise<Response> {
    const previousDepth = this.queue.length;
    this.queue = [];
    await this.saveQueue();

    return new Response(
      JSON.stringify({
        success: true,
        clearedCount: previousDepth,
      }),
      { headers: { 'Content-Type': 'application/json' } },
    );
  }

  /**
   * Enqueue a card for work
   */
  async enqueue(
    card: CardWorkItem,
    mode: 'ai-code' | 'ai-plan',
    config: VibeConfig,
    priority = 100,
  ): Promise<number> {
    const item: QueueItem = {
      card,
      mode,
      config,
      enqueuedAt: Date.now(),
      priority,
    };

    const insertIndex = this.queue.findIndex((q) => q.priority > item.priority);
    if (insertIndex === -1) {
      this.queue.push(item);
    } else {
      this.queue.splice(insertIndex, 0, item);
    }

    await this.saveQueue();
    return insertIndex === -1 ? this.queue.length : insertIndex + 1;
  }

  /**
   * Dequeue the next card
   */
  async dequeue(): Promise<QueueItem | null> {
    const item = this.queue.shift();
    if (item) {
      await this.saveQueue();
    }
    return item ?? null;
  }

  /**
   * Peek at the next card without removing
   */
  peek(): QueueItem | null {
    return this.queue[0] ?? null;
  }

  /**
   * Remove a specific card from the queue
   */
  async remove(cardNumber: number): Promise<boolean> {
    const index = this.queue.findIndex((q) => q.card.number === cardNumber);
    if (index === -1) {
      return false;
    }

    this.queue.splice(index, 1);
    await this.saveQueue();
    return true;
  }

  /**
   * Get queue status
   */
  getQueueStatus(): {
    depth: number;
    items: Array<{ cardNumber: number; cardTitle: string; mode: string }>;
  } {
    return {
      depth: this.queue.length,
      items: this.queue.map((q) => ({
        cardNumber: q.card.number,
        cardTitle: q.card.title,
        mode: q.mode,
      })),
    };
  }
}
