/**
 * Webhook Handler
 *
 * Receives webhooks from Fizzy when cards change, filters for AI-tagged
 * cards, and stores pending work in KV for retrieval by AI agents.
 *
 * Route: POST /webhooks/fizzy
 */

import type { Context } from 'hono';
import { Hono } from 'hono';
import { z } from 'zod';
import type { HonoEnv } from '../types';
import type { WebhookSecretEntry } from '@fizzy-do-mcp/shared';
import { WebhookEventSchema, detectWorkMode, isWorkTriggerColumn } from '@fizzy-do-mcp/shared';
import { dispatchWork, cancelWork, type WebhookCardData } from './dispatcher';

/**
 * Schema for card data in webhook payloads.
 */
const WebhookCardSchema = z.object({
  number: z.number(),
  title: z.string(),
  description: z.string().nullable(),
  tags: z.array(z.string()),
  board_id: z.string(),
  board_name: z.string().optional(),
  column: z
    .object({
      id: z.string(),
      name: z.string(),
    })
    .optional(),
});

/**
 * Schema for comment data in webhook payloads.
 */
const WebhookCommentSchema = z.object({
  id: z.string(),
  body: z.string(),
  card_number: z.number(),
});

/**
 * Schema for the full webhook payload.
 */
const WebhookPayloadSchema = z.object({
  event: WebhookEventSchema,
  account_slug: z.string(),
  card: WebhookCardSchema.optional(),
  comment: WebhookCommentSchema.optional(),
});

type WebhookPayload = z.infer<typeof WebhookPayloadSchema>;

/**
 * Webhook routes for Fizzy events.
 */
export const webhookRoutes = new Hono<HonoEnv>();

/**
 * Verify webhook signature using per-account secrets from KV.
 *
 * Validates the X-Webhook-Signature header against the stored secret.
 * Returns verification result with reason for logging.
 *
 * @internal Exported for testing
 */
export async function verifyWebhookSignature(
  request: Request,
  body: string,
  secret: string,
): Promise<{ valid: boolean; reason?: string }> {
  const signature = request.headers.get('X-Webhook-Signature');
  if (!signature) {
    return { valid: false, reason: 'Missing X-Webhook-Signature header' };
  }

  // Compute expected signature (HMAC-SHA256)
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );

  const signatureBytes = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
  const expectedSignature = Array.from(new Uint8Array(signatureBytes))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  // Fizzy sends signature as hex string (no prefix based on user's description)
  // Try both formats: with and without sha256= prefix
  const signatureHex = signature.startsWith('sha256=') ? signature.slice(7) : signature;

  // Timing-safe comparison
  if (signatureHex.length !== expectedSignature.length) {
    return { valid: false, reason: 'Signature length mismatch' };
  }

  let match = true;
  for (let i = 0; i < signatureHex.length; i++) {
    if (signatureHex[i] !== expectedSignature[i]) {
      match = false;
    }
  }

  if (!match) {
    return { valid: false, reason: 'Signature mismatch' };
  }

  return { valid: true };
}

/**
 * Look up webhook secret from KV for a given account.
 */
async function getWebhookSecret(kv: KVNamespace, accountSlug: string): Promise<string | null> {
  const entry = await kv.get<WebhookSecretEntry>(accountSlug, 'json');
  return entry?.secret ?? null;
}

/**
 * Convert webhook card to WebhookCardData.
 */
function toCardData(card: z.infer<typeof WebhookCardSchema>): WebhookCardData {
  return {
    number: card.number,
    title: card.title,
    board_id: card.board_id,
    board_name: card.board_name ?? 'Unknown Board',
    column_name: card.column?.name ?? null,
  };
}

/**
 * Check for @ai start command in comment body.
 */
function hasAiStartCommand(body: string): boolean {
  const normalizedBody = body.toLowerCase().trim();
  return normalizedBody.includes('@ai start') || normalizedBody.includes('@ai go');
}

/**
 * POST /webhooks/fizzy
 *
 * Receives Fizzy webhook payloads and processes them.
 * Requires valid webhook signature for the account.
 */
webhookRoutes.post('/fizzy', async (c) => {
  // Read raw body for signature verification
  const rawBody = await c.req.text();

  // Parse the payload first to get account_slug for secret lookup
  let payload: WebhookPayload;
  try {
    const json: unknown = JSON.parse(rawBody);
    const parseResult = WebhookPayloadSchema.safeParse(json);
    if (!parseResult.success) {
      console.error('Invalid webhook payload:', parseResult.error.format());
      return c.json(
        {
          error: 'invalid_payload',
          message: 'Invalid webhook payload format',
          details: parseResult.error.format(),
        },
        400,
      );
    }
    payload = parseResult.data;
  } catch {
    return c.json(
      {
        error: 'parse_error',
        message: 'Failed to parse webhook payload',
      },
      400,
    );
  }

  // Verify webhook signature using per-account secret from KV
  const kv = c.env.WEBHOOK_SECRETS;
  const secret = await getWebhookSecret(kv, payload.account_slug);

  if (!secret) {
    console.warn(`Webhook rejected: No secret configured for account ${payload.account_slug}`);
    return c.json(
      {
        error: 'unauthorized',
        message:
          'No webhook secret configured for this account. Set up webhook authentication first.',
      },
      401,
    );
  }

  const verification = await verifyWebhookSignature(c.req.raw, rawBody, secret);
  if (!verification.valid) {
    console.warn(
      `Webhook signature verification failed for account ${payload.account_slug}: ${verification.reason}`,
    );
    return c.json(
      {
        error: 'invalid_signature',
        message: `Webhook signature verification failed: ${verification.reason}`,
      },
      401,
    );
  }

  console.log(`Received webhook: ${payload.event} for account ${payload.account_slug}`);

  // Route based on event type
  switch (payload.event) {
    case 'card_triaged':
      return handleCardTriaged(c, payload);

    case 'card_published':
      return handleCardPublished(c, payload);

    case 'comment_created':
      return handleCommentCreated(c, payload);

    case 'card_closed':
    case 'card_postponed':
    case 'card_auto_postponed':
      return handleCardRemoved(c, payload);

    case 'card_sent_back_to_triage':
      return handleCardSentBackToTriage(c, payload);

    default:
      // Acknowledge but don't process other events
      return c.json({
        processed: false,
        reason: `Event type ${payload.event} not handled`,
      });
  }
});

/**
 * Handle card_triaged event.
 *
 * Check if card was moved to a trigger column and has AI tags.
 */
async function handleCardTriaged(c: Context<HonoEnv>, payload: WebhookPayload) {
  const { card, account_slug } = payload;

  if (!card) {
    return c.json({
      processed: false,
      reason: 'No card data in payload',
    });
  }

  // Check if card is in a trigger column
  const columnName = card.column?.name;
  if (!columnName || !isWorkTriggerColumn(columnName)) {
    return c.json({
      processed: false,
      reason: `Card is in column "${columnName ?? 'unknown'}", not a trigger column`,
    });
  }

  // Check if card has AI work tags
  const mode = detectWorkMode(card.tags);
  if (!mode) {
    return c.json({
      processed: false,
      reason: 'Card does not have AI work tags (ai-code, ai-plan, etc.)',
    });
  }

  // Dispatch work to KV
  const result = await dispatchWork(c.env, account_slug, toCardData(card), mode, 'card_triaged');

  if (result.success) {
    return c.json({
      processed: true,
      card_number: card.number,
      mode,
      work_id: result.work_id,
    });
  }

  return c.json(
    {
      processed: false,
      error: result.error,
    },
    result.error?.includes('already exists') ? 409 : 500,
  );
}

/**
 * Handle card_published event.
 *
 * Check if newly published card has AI tags and is in a trigger column.
 */
async function handleCardPublished(c: Context<HonoEnv>, payload: WebhookPayload) {
  const { card, account_slug } = payload;

  if (!card) {
    return c.json({
      processed: false,
      reason: 'No card data in payload',
    });
  }

  // Check if card is in a trigger column (or has no column yet)
  const columnName = card.column?.name;
  if (columnName && !isWorkTriggerColumn(columnName)) {
    return c.json({
      processed: false,
      reason: `Card is in column "${columnName}", not a trigger column`,
    });
  }

  // Check if card has AI work tags
  const mode = detectWorkMode(card.tags);
  if (!mode) {
    return c.json({
      processed: false,
      reason: 'Card does not have AI work tags',
    });
  }

  // Dispatch work to KV
  const result = await dispatchWork(c.env, account_slug, toCardData(card), mode, 'card_tagged');

  if (result.success) {
    return c.json({
      processed: true,
      card_number: card.number,
      mode,
      work_id: result.work_id,
    });
  }

  return c.json(
    {
      processed: false,
      error: result.error,
    },
    result.error?.includes('already exists') ? 409 : 500,
  );
}

/**
 * Handle comment_created event.
 *
 * Check for @ai start command in comment body.
 */
async function handleCommentCreated(c: Context<HonoEnv>, payload: WebhookPayload) {
  const { comment, card, account_slug } = payload;

  if (!comment) {
    return c.json({
      processed: false,
      reason: 'No comment data in payload',
    });
  }

  // Check for @ai start command
  if (!hasAiStartCommand(comment.body)) {
    return c.json({
      processed: false,
      reason: 'Comment does not contain @ai start command',
    });
  }

  // We need card data to dispatch work
  if (!card) {
    return c.json({
      processed: false,
      reason: 'No card data in payload for @ai start command',
    });
  }

  // Check if card has AI tags
  const mode = detectWorkMode(card.tags);
  if (!mode) {
    return c.json({
      processed: false,
      reason: 'Card does not have AI work tags',
    });
  }

  // Dispatch work (regardless of column for @ai start)
  const result = await dispatchWork(c.env, account_slug, toCardData(card), mode, 'manual');

  if (result.success) {
    return c.json({
      processed: true,
      card_number: card.number,
      mode,
      work_id: result.work_id,
      trigger: '@ai start',
    });
  }

  return c.json(
    {
      processed: false,
      error: result.error,
    },
    result.error?.includes('already exists') ? 409 : 500,
  );
}

/**
 * Handle card_closed, card_postponed, and card_auto_postponed events.
 *
 * Cancel any pending work for the card.
 */
async function handleCardRemoved(c: Context<HonoEnv>, payload: WebhookPayload) {
  const { card, account_slug, event } = payload;

  if (!card) {
    return c.json({
      processed: false,
      reason: 'No card data in payload',
    });
  }

  // Cancel any work for this card
  await cancelWork(c.env, account_slug, card.number, event);

  return c.json({
    processed: true,
    card_number: card.number,
    action: 'cancelled',
    reason: event,
  });
}

/**
 * Handle card_sent_back_to_triage event.
 *
 * Cancel any pending work since card is no longer in a work column.
 */
async function handleCardSentBackToTriage(c: Context<HonoEnv>, payload: WebhookPayload) {
  const { card, account_slug } = payload;

  if (!card) {
    return c.json({
      processed: false,
      reason: 'No card data in payload',
    });
  }

  // Cancel any work for this card
  await cancelWork(c.env, account_slug, card.number, 'card_sent_back_to_triage');

  return c.json({
    processed: true,
    card_number: card.number,
    action: 'cancelled',
    reason: 'card_sent_back_to_triage',
  });
}

/**
 * GET /webhooks/health
 *
 * Health check endpoint for the webhook service.
 */
webhookRoutes.get('/health', (c) => {
  return c.json({
    status: 'ok',
    service: 'webhooks',
    timestamp: new Date().toISOString(),
  });
});
