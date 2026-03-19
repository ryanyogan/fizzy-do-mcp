/**
 * Account API Handler
 *
 * Manages per-account webhook secret storage for signature verification.
 * Secrets are stored in Cloudflare KV keyed by account slug.
 *
 * Routes:
 *   GET    /accounts/webhook-secret  - Check if webhook is configured
 *   POST   /accounts/webhook-secret  - Store webhook secret
 *   DELETE /accounts/webhook-secret  - Remove webhook secret
 */

import type { Context } from 'hono';
import { Hono } from 'hono';
import type { HonoEnv } from '../types';
import {
  StoreWebhookSecretInputSchema,
  type WebhookSecretEntry,
  type WebhookStatusResponse,
} from '@fizzy-do-mcp/shared';
import { validateFizzyToken } from '../websocket/auth';

/**
 * Account routes for webhook secret management.
 */
export const accountRoutes = new Hono<HonoEnv>();

/**
 * Extract and validate the Fizzy token from Authorization header.
 * Returns user info if valid, or responds with 401.
 */
async function requireAuth(c: Context<HonoEnv>) {
  const authHeader = c.req.header('Authorization');

  if (!authHeader?.startsWith('Bearer ')) {
    return {
      error: c.json(
        { error: 'unauthorized', message: 'Missing or invalid Authorization header' },
        401,
      ),
    };
  }

  const token = authHeader.slice(7);
  const user = await validateFizzyToken(token);

  if (!user) {
    return {
      error: c.json({ error: 'unauthorized', message: 'Invalid Fizzy token' }, 401),
    };
  }

  return { user, token };
}

/**
 * GET /accounts/webhook-secret
 *
 * Check if a webhook secret is configured for the authenticated user's account.
 * Returns status without exposing the actual secret.
 */
accountRoutes.get('/webhook-secret', async (c) => {
  const auth = await requireAuth(c);
  if ('error' in auth) return auth.error;

  const { user } = auth;
  const kv = c.env.WEBHOOK_SECRETS;

  // Look up secret entry by account slug
  const entry = await kv.get<WebhookSecretEntry>(user.accountSlug, 'json');

  const response: WebhookStatusResponse = {
    configured: entry !== null,
    account_slug: user.accountSlug,
    account_name: user.name,
    created_at: entry?.created_at,
    updated_at: entry?.updated_at,
  };

  return c.json(response);
});

/**
 * POST /accounts/webhook-secret
 *
 * Store a webhook secret for the authenticated user's account.
 * Overwrites any existing secret.
 */
accountRoutes.post('/webhook-secret', async (c) => {
  const auth = await requireAuth(c);
  if ('error' in auth) return auth.error;

  const { user } = auth;
  const kv = c.env.WEBHOOK_SECRETS;

  // Parse and validate request body
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'invalid_json', message: 'Request body must be valid JSON' }, 400);
  }

  const parseResult = StoreWebhookSecretInputSchema.safeParse(body);
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

  const { secret } = parseResult.data;
  const now = new Date().toISOString();

  // Check if updating existing or creating new
  const existing = await kv.get<WebhookSecretEntry>(user.accountSlug, 'json');

  const entry: WebhookSecretEntry = {
    secret,
    created_at: existing?.created_at ?? now,
    updated_at: now,
  };

  // Store the secret
  await kv.put(user.accountSlug, JSON.stringify(entry));

  console.log(`Webhook secret ${existing ? 'updated' : 'stored'} for account ${user.accountSlug}`);

  const response: WebhookStatusResponse = {
    configured: true,
    account_slug: user.accountSlug,
    account_name: user.name,
    created_at: entry.created_at,
    updated_at: entry.updated_at,
  };

  return c.json(response, existing ? 200 : 201);
});

/**
 * DELETE /accounts/webhook-secret
 *
 * Remove the webhook secret for the authenticated user's account.
 */
accountRoutes.delete('/webhook-secret', async (c) => {
  const auth = await requireAuth(c);
  if ('error' in auth) return auth.error;

  const { user } = auth;
  const kv = c.env.WEBHOOK_SECRETS;

  // Check if secret exists
  const existing = await kv.get(user.accountSlug);
  if (!existing) {
    return c.json(
      { error: 'not_found', message: 'No webhook secret configured for this account' },
      404,
    );
  }

  // Delete the secret
  await kv.delete(user.accountSlug);

  console.log(`Webhook secret deleted for account ${user.accountSlug}`);

  return c.json({
    deleted: true,
    account_slug: user.accountSlug,
  });
});
