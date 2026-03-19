import { z } from 'zod';

/**
 * Valid webhook event types that can trigger webhook deliveries.
 */
export const WebhookEventSchema = z.enum([
  'card_assigned',
  'card_unassigned',
  'card_closed',
  'card_reopened',
  'card_postponed',
  'card_auto_postponed',
  'card_published',
  'card_triaged',
  'card_sent_back_to_triage',
  'card_board_changed',
  'comment_created',
]);

export type WebhookEvent = z.infer<typeof WebhookEventSchema>;

/**
 * All available webhook events.
 */
export const WEBHOOK_EVENTS = WebhookEventSchema.options;

/**
 * Schema for a webhook object returned by the API.
 */
export const WebhookSchema = z.object({
  id: z.string(),
  url: z.string().url(),
  events: z.array(WebhookEventSchema),
  active: z.boolean(),
  secret: z.string().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type Webhook = z.infer<typeof WebhookSchema>;

/**
 * Schema for webhook list response.
 */
export const WebhookListSchema = z.array(WebhookSchema);

export type WebhookList = z.infer<typeof WebhookListSchema>;

/**
 * Schema for creating a webhook.
 */
export const CreateWebhookInputSchema = z.object({
  url: z.string().url('Webhook URL must be a valid URL'),
  events: z.array(WebhookEventSchema).min(1, 'At least one event is required'),
  active: z.boolean().optional().default(true),
});

export type CreateWebhookInput = z.infer<typeof CreateWebhookInputSchema>;

/**
 * Schema for updating a webhook.
 */
export const UpdateWebhookInputSchema = z.object({
  url: z.string().url('Webhook URL must be a valid URL').optional(),
  events: z.array(WebhookEventSchema).min(1, 'At least one event is required').optional(),
  active: z.boolean().optional(),
});

export type UpdateWebhookInput = z.infer<typeof UpdateWebhookInputSchema>;

/**
 * Schema for webhook test response.
 */
export const WebhookTestResponseSchema = z.object({
  success: z.boolean(),
  status_code: z.number().optional(),
  response_time_ms: z.number().optional(),
  error: z.string().optional(),
});

export type WebhookTestResponse = z.infer<typeof WebhookTestResponseSchema>;

// ============================================================================
// Webhook Secret Storage (for multi-tenant signature verification)
// ============================================================================

/**
 * Schema for webhook secret entry stored in KV.
 * Key is the account_slug (e.g., "/6099243").
 */
export const WebhookSecretEntrySchema = z.object({
  /** The HMAC secret for verifying webhook signatures */
  secret: z.string().min(1),
  /** ISO timestamp when the secret was first stored */
  created_at: z.string(),
  /** ISO timestamp when the secret was last updated */
  updated_at: z.string(),
});

export type WebhookSecretEntry = z.infer<typeof WebhookSecretEntrySchema>;

/**
 * Schema for webhook status response from the API.
 */
export const WebhookStatusResponseSchema = z.object({
  /** Whether a webhook secret is configured for this account */
  configured: z.boolean(),
  /** The account slug this status is for */
  account_slug: z.string(),
  /** The account name for display */
  account_name: z.string(),
  /** ISO timestamp when the secret was created (if configured) */
  created_at: z.string().optional(),
  /** ISO timestamp when the secret was last updated (if configured) */
  updated_at: z.string().optional(),
});

export type WebhookStatusResponse = z.infer<typeof WebhookStatusResponseSchema>;

/**
 * Schema for storing a webhook secret.
 */
export const StoreWebhookSecretInputSchema = z.object({
  /** The webhook secret from Fizzy */
  secret: z.string().min(8, 'Webhook secret must be at least 8 characters'),
});

export type StoreWebhookSecretInput = z.infer<typeof StoreWebhookSecretInputSchema>;
