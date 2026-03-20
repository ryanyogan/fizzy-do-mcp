/**
 * Type definitions for the hosted Fizzy MCP service
 *
 * Simplified version - no auth, no rate limiting
 */

/// <reference types="@cloudflare/workers-types" />

/**
 * Cloudflare Worker environment bindings
 */
export interface Env {
  // Environment (development, staging, production)
  ENVIRONMENT: 'development' | 'staging' | 'production';

  // KV namespace for webhook secrets (per-account)
  WEBHOOK_SECRETS: KVNamespace;

  // KV namespace for pending work items
  PENDING_WORK: KVNamespace;
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
