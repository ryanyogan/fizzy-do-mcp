/**
 * Card Lock Durable Object
 *
 * Prevents duplicate work on cards by tracking which session owns
 * which card. One global instance.
 *
 * Responsibilities:
 * - Track card locks (which session is working on which card)
 * - Prevent multiple sessions from working on the same card
 * - Handle lock expiration and cleanup
 */

import { DurableObject } from 'cloudflare:workers';
import type { Env } from '../types';

/**
 * Lock information
 */
interface LockInfo {
  /** Card number */
  cardNumber: number;
  /** Session ID that owns the lock */
  sessionId: string;
  /** Account slug */
  accountSlug: string;
  /** When the lock was acquired */
  acquiredAt: number;
  /** Lock expiration time (for auto-cleanup) */
  expiresAt: number;
}

/**
 * Default lock TTL (30 minutes)
 */
const DEFAULT_LOCK_TTL_MS = 30 * 60 * 1000;

/**
 * Card Lock Durable Object
 *
 * Manages locks on cards to prevent duplicate work.
 */
export class CardLock extends DurableObject<Env> {
  /** Active locks by card number */
  private locks: Map<number, LockInfo> = new Map();

  /** Storage key for persisting locks */
  private static readonly STORAGE_KEY = 'locks';

  /** Cleanup interval ID */
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);

    // Load locks from storage on startup
    void this.ctx.blockConcurrencyWhile(async () => {
      const stored = await this.ctx.storage.get<Array<[number, LockInfo]>>(CardLock.STORAGE_KEY);
      if (stored) {
        this.locks = new Map(stored);
        // Clean up expired locks
        void this.cleanupExpiredLocks();
      }
    });

    // Start cleanup interval
    this.startCleanupInterval();
  }

  /**
   * Start the cleanup interval
   */
  private startCleanupInterval(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    this.cleanupInterval = setInterval(() => {
      void this.cleanupExpiredLocks();
    }, 60000); // Cleanup every minute
  }

  /**
   * Clean up expired locks
   */
  private async cleanupExpiredLocks(): Promise<void> {
    const now = Date.now();
    let changed = false;

    for (const [cardNumber, lock] of this.locks) {
      if (lock.expiresAt < now) {
        this.locks.delete(cardNumber);
        changed = true;
        console.log(`Lock on card ${cardNumber} expired, removed`);
      }
    }

    if (changed) {
      await this.saveLocks();
    }
  }

  /**
   * Persist locks to storage
   */
  private async saveLocks(): Promise<void> {
    await this.ctx.storage.put(CardLock.STORAGE_KEY, Array.from(this.locks.entries()));
  }

  /**
   * Handle incoming fetch requests
   */
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    switch (url.pathname) {
      case '/acquire':
        return this.handleAcquire(request);
      case '/release':
        return this.handleRelease(request);
      case '/check':
        return this.handleCheck(request);
      case '/owner':
        return this.handleGetOwner(request);
      case '/status':
        return this.handleStatus();
      case '/release-all':
        return this.handleReleaseAll(request);
      default:
        return new Response('Not found', { status: 404 });
    }
  }

  /**
   * Handle acquire lock request
   */
  private async handleAcquire(request: Request): Promise<Response> {
    try {
      const body = (await request.json()) as {
        cardNumber: number;
        sessionId: string;
        accountSlug?: string;
        ttlMs?: number;
      };

      const { cardNumber, sessionId, accountSlug = '', ttlMs = DEFAULT_LOCK_TTL_MS } = body;

      const result = await this.acquireLock(cardNumber, sessionId, accountSlug, ttlMs);

      return new Response(JSON.stringify(result), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      return new Response(
        JSON.stringify({
          acquired: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      );
    }
  }

  /**
   * Handle release lock request
   */
  private async handleRelease(request: Request): Promise<Response> {
    try {
      const body = (await request.json()) as {
        cardNumber: number;
        sessionId: string;
      };

      const { cardNumber, sessionId } = body;
      const released = await this.releaseLock(cardNumber, sessionId);

      return new Response(JSON.stringify({ released }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      return new Response(
        JSON.stringify({
          released: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      );
    }
  }

  /**
   * Handle check lock request
   */
  private async handleCheck(request: Request): Promise<Response> {
    try {
      const url = new URL(request.url);
      const cardNumber = parseInt(url.searchParams.get('cardNumber') ?? '0', 10);

      const locked = this.isLocked(cardNumber);

      return new Response(JSON.stringify({ locked }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      return new Response(
        JSON.stringify({
          locked: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      );
    }
  }

  /**
   * Handle get owner request
   */
  private async handleGetOwner(request: Request): Promise<Response> {
    try {
      const url = new URL(request.url);
      const cardNumber = parseInt(url.searchParams.get('cardNumber') ?? '0', 10);

      const owner = this.getOwner(cardNumber);

      return new Response(JSON.stringify({ owner }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      return new Response(
        JSON.stringify({
          owner: null,
          error: error instanceof Error ? error.message : 'Unknown error',
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      );
    }
  }

  /**
   * Handle status request
   */
  private handleStatus(): Response {
    const locks = Array.from(this.locks.values()).map((lock) => ({
      cardNumber: lock.cardNumber,
      sessionId: lock.sessionId,
      accountSlug: lock.accountSlug,
      acquiredAt: lock.acquiredAt,
      expiresAt: lock.expiresAt,
    }));

    return new Response(
      JSON.stringify({
        activeLocks: locks.length,
        locks,
      }),
      { headers: { 'Content-Type': 'application/json' } },
    );
  }

  /**
   * Handle release all locks for a session
   */
  private async handleReleaseAll(request: Request): Promise<Response> {
    try {
      const body = (await request.json()) as { sessionId: string };
      const { sessionId } = body;

      let releasedCount = 0;
      const toRelease: number[] = [];

      for (const [cardNumber, lock] of this.locks) {
        if (lock.sessionId === sessionId) {
          toRelease.push(cardNumber);
        }
      }

      for (const cardNumber of toRelease) {
        this.locks.delete(cardNumber);
        releasedCount++;
      }

      if (releasedCount > 0) {
        await this.saveLocks();
      }

      return new Response(JSON.stringify({ releasedCount }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      return new Response(
        JSON.stringify({
          releasedCount: 0,
          error: error instanceof Error ? error.message : 'Unknown error',
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      );
    }
  }

  /**
   * Try to acquire a lock on a card
   *
   * @param cardNumber - Card number to lock
   * @param sessionId - Session trying to acquire the lock
   * @param accountSlug - Account slug for the session
   * @param ttlMs - Lock TTL in milliseconds
   * @returns Lock acquisition result
   */
  async acquireLock(
    cardNumber: number,
    sessionId: string,
    accountSlug = '',
    ttlMs = DEFAULT_LOCK_TTL_MS,
  ): Promise<{ acquired: boolean; owner?: string; expiresAt?: number }> {
    const existingLock = this.locks.get(cardNumber);
    const now = Date.now();

    // If there's an existing lock that hasn't expired
    if (existingLock && existingLock.expiresAt > now) {
      // If it's owned by the same session, extend the lock
      if (existingLock.sessionId === sessionId) {
        existingLock.expiresAt = now + ttlMs;
        await this.saveLocks();
        return { acquired: true, expiresAt: existingLock.expiresAt };
      }

      // Otherwise, lock is held by someone else
      return { acquired: false, owner: existingLock.sessionId };
    }

    // Lock is available, acquire it
    const lock: LockInfo = {
      cardNumber,
      sessionId,
      accountSlug,
      acquiredAt: now,
      expiresAt: now + ttlMs,
    };

    this.locks.set(cardNumber, lock);
    await this.saveLocks();

    return { acquired: true, expiresAt: lock.expiresAt };
  }

  /**
   * Release a lock on a card
   *
   * @param cardNumber - Card number to unlock
   * @param sessionId - Session trying to release the lock
   * @returns True if lock was released, false if not owned by session
   */
  async releaseLock(cardNumber: number, sessionId: string): Promise<boolean> {
    const lock = this.locks.get(cardNumber);

    if (!lock) {
      // No lock exists, consider it released
      return true;
    }

    if (lock.sessionId !== sessionId) {
      // Lock is owned by someone else
      return false;
    }

    this.locks.delete(cardNumber);
    await this.saveLocks();
    return true;
  }

  /**
   * Check if a card is locked
   *
   * @param cardNumber - Card number to check
   * @returns True if card is locked, false otherwise
   */
  isLocked(cardNumber: number): boolean {
    const lock = this.locks.get(cardNumber);
    if (!lock) {
      return false;
    }

    // Check if lock has expired
    if (lock.expiresAt < Date.now()) {
      return false;
    }

    return true;
  }

  /**
   * Get the session that owns a card lock
   *
   * @param cardNumber - Card number to check
   * @returns Session ID of owner, or null if not locked
   */
  getOwner(cardNumber: number): string | null {
    const lock = this.locks.get(cardNumber);
    if (!lock) {
      return null;
    }

    // Check if lock has expired
    if (lock.expiresAt < Date.now()) {
      return null;
    }

    return lock.sessionId;
  }
}
