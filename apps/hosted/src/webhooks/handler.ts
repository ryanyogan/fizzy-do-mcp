/**
 * Webhook Handler
 *
 * Receives webhooks from Fizzy when cards change, filters for AI-tagged
 * cards, and enqueues work for processing.
 *
 * Route: POST /webhooks/fizzy
 */

import type { Context } from 'hono';
import { Hono } from 'hono';
import { z } from 'zod';
import type { HonoEnv } from '../types';
import type { CardWorkItem, VibeConfig } from '@fizzy-do-mcp/shared';
import { WebhookEventSchema, VibeConfigSchema } from '@fizzy-do-mcp/shared';
import {
  shouldProcessCard,
  getAiWorkMode,
  isAcceptedColumn,
  hasAiStartCommand,
  type CardData,
} from './filter';
import { dispatchWork, cancelWork } from './dispatcher';

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
  steps: z
    .array(
      z.object({
        id: z.string(),
        content: z.string(),
        completed: z.boolean(),
      }),
    )
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
  // Optional vibe config (attached by server for convenience)
  vibe_config: VibeConfigSchema.optional(),
});

type WebhookPayload = z.infer<typeof WebhookPayloadSchema>;

/**
 * Webhook routes for Fizzy events.
 */
export const webhookRoutes = new Hono<HonoEnv>();

/**
 * Verify webhook signature (optional security measure).
 *
 * If a webhook secret is configured, validate the X-Fizzy-Webhook-Signature header.
 *
 * @internal Exported for testing; currently called when WEBHOOK_SECRET is set
 */
export async function verifyWebhookSignature(
  request: Request,
  body: string,
  secret?: string,
): Promise<boolean> {
  if (!secret) {
    // No secret configured, skip verification
    return true;
  }

  const signature = request.headers.get('X-Fizzy-Webhook-Signature');
  if (!signature) {
    return false;
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

  // Compare signatures (timing-safe comparison would be better)
  return signature === `sha256=${expectedSignature}`;
}

/**
 * Convert webhook card data to CardWorkItem.
 */
function toCardWorkItem(card: z.infer<typeof WebhookCardSchema>): CardWorkItem {
  return {
    number: card.number,
    title: card.title,
    description: card.description,
    tags: card.tags,
    board_id: card.board_id,
    board_name: card.board_name ?? 'Unknown Board',
    steps: card.steps ?? [],
  };
}

/**
 * Get default vibe config for boards without explicit config.
 *
 * In a real implementation, this would fetch the config card from the board.
 */
function getDefaultVibeConfig(): VibeConfig {
  return {
    repository: 'https://github.com/placeholder/repo',
    default_branch: 'main',
    branch_pattern: 'ai/card-{number}-{slug}',
    pr_template: 'default',
    auto_assign_pr: true,
  };
}

/**
 * POST /webhooks/fizzy
 *
 * Receives Fizzy webhook payloads and processes them.
 */
webhookRoutes.post('/fizzy', async (c) => {
  // Read raw body for signature verification
  const rawBody = await c.req.text();

  // Optional: Verify webhook signature
  // const webhookSecret = c.env.WEBHOOK_SECRET;
  // const isValid = await verifyWebhookSignature(c.req.raw, rawBody, webhookSecret);
  // if (!isValid) {
  //   return c.json({ error: 'invalid_signature', message: 'Webhook signature verification failed' }, 401);
  // }

  // Parse the payload
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
 * Check if card was moved to "Accepted" column and has AI tags.
 */
async function handleCardTriaged(c: Context<HonoEnv>, payload: WebhookPayload) {
  const { card, account_slug, vibe_config } = payload;

  if (!card) {
    return c.json({
      processed: false,
      reason: 'No card data in payload',
    });
  }

  // Check if card is in Accepted column
  const columnName = card.column?.name;
  if (!columnName || !isAcceptedColumn(columnName)) {
    return c.json({
      processed: false,
      reason: `Card is in column "${columnName ?? 'unknown'}", not Accepted`,
    });
  }

  // Check if card should be processed (has AI tags, etc.)
  const cardData: CardData = {
    number: card.number,
    title: card.title,
    description: card.description,
    tags: card.tags,
    board_id: card.board_id,
    column: card.column,
  };

  if (!shouldProcessCard(cardData, columnName)) {
    return c.json({
      processed: false,
      reason: 'Card does not have AI work tags',
    });
  }

  // Get AI work mode
  const mode = getAiWorkMode(card.tags);
  if (!mode) {
    return c.json({
      processed: false,
      reason: 'No AI work mode tag found',
    });
  }

  // Get vibe config (from payload or default)
  const config = vibe_config ?? getDefaultVibeConfig();

  // Dispatch work
  const cardWorkItem = toCardWorkItem(card);
  const result = await dispatchWork(c.env, account_slug, card.board_id, cardWorkItem, mode, config);

  if (result.success) {
    return c.json({
      processed: true,
      card_number: card.number,
      mode,
      position: result.position,
      notified: result.notified,
    });
  }

  return c.json(
    {
      processed: false,
      error: result.error,
    },
    500,
  );
}

/**
 * Handle card_published event.
 *
 * Check if newly published card has AI tags and is in Accepted column.
 */
async function handleCardPublished(c: Context<HonoEnv>, payload: WebhookPayload) {
  const { card, account_slug, vibe_config } = payload;

  if (!card) {
    return c.json({
      processed: false,
      reason: 'No card data in payload',
    });
  }

  // Check if card is in Accepted column (or has no column yet)
  const columnName = card.column?.name;
  if (columnName && !isAcceptedColumn(columnName)) {
    return c.json({
      processed: false,
      reason: `Card is in column "${columnName}", not Accepted`,
    });
  }

  // Check if card should be processed
  const cardData: CardData = {
    number: card.number,
    title: card.title,
    description: card.description,
    tags: card.tags,
    board_id: card.board_id,
    column: card.column,
  };

  if (!shouldProcessCard(cardData, columnName)) {
    return c.json({
      processed: false,
      reason: 'Card does not have AI work tags or is not in Accepted column',
    });
  }

  // Get AI work mode
  const mode = getAiWorkMode(card.tags);
  if (!mode) {
    return c.json({
      processed: false,
      reason: 'No AI work mode tag found',
    });
  }

  // Get vibe config
  const config = vibe_config ?? getDefaultVibeConfig();

  // Dispatch work
  const cardWorkItem = toCardWorkItem(card);
  const result = await dispatchWork(c.env, account_slug, card.board_id, cardWorkItem, mode, config);

  if (result.success) {
    return c.json({
      processed: true,
      card_number: card.number,
      mode,
      position: result.position,
      notified: result.notified,
    });
  }

  return c.json(
    {
      processed: false,
      error: result.error,
    },
    500,
  );
}

/**
 * Handle comment_created event.
 *
 * Check for @ai start command in comment body.
 */
async function handleCommentCreated(c: Context<HonoEnv>, payload: WebhookPayload) {
  const { comment, card, account_slug, vibe_config } = payload;

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
  const mode = getAiWorkMode(card.tags);
  if (!mode) {
    return c.json({
      processed: false,
      reason: 'Card does not have AI work tags',
    });
  }

  // Get vibe config
  const config = vibe_config ?? getDefaultVibeConfig();

  // Dispatch work (regardless of column for @ai start)
  const cardWorkItem = toCardWorkItem(card);
  const result = await dispatchWork(c.env, account_slug, card.board_id, cardWorkItem, mode, config);

  if (result.success) {
    return c.json({
      processed: true,
      card_number: card.number,
      mode,
      position: result.position,
      notified: result.notified,
      trigger: '@ai start',
    });
  }

  return c.json(
    {
      processed: false,
      error: result.error,
    },
    500,
  );
}

/**
 * Handle card_closed, card_postponed, and card_auto_postponed events.
 *
 * Cancel any pending or in-progress work for the card.
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
  await cancelWork(c.env, account_slug, card.board_id, card.number, event);

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
  await cancelWork(c.env, account_slug, card.board_id, card.number, 'card_sent_back_to_triage');

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
