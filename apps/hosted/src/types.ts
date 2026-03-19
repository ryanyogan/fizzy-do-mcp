/**
 * Type definitions for the hosted Fizzy MCP service
 *
 * Simplified version - no auth, no rate limiting
 */

/// <reference types="@cloudflare/workers-types" />

import type { SessionRegistry } from './durable-objects/session-registry';
import type { WorkQueue } from './durable-objects/work-queue';
import type { CardLock } from './durable-objects/card-lock';

/**
 * Cloudflare Worker environment bindings
 */
export interface Env {
  // Environment (development, staging, production)
  ENVIRONMENT: 'development' | 'staging' | 'production';

  // Durable Object bindings
  SESSION_REGISTRY: DurableObjectNamespace<SessionRegistry>;
  WORK_QUEUE: DurableObjectNamespace<WorkQueue>;
  CARD_LOCK: DurableObjectNamespace<CardLock>;
}

/**
 * Fizzy token context - passed from headers
 */
export interface FizzyContext {
  token: string;
  accountSlug: string | undefined;
}

/**
 * Hono app variables (available via c.get/c.set)
 */
export interface AppVariables {
  fizzy: FizzyContext;
  requestId: string;
}

/**
 * Combined Hono bindings type
 */
export interface HonoEnv {
  Bindings: Env;
  Variables: AppVariables;
}
