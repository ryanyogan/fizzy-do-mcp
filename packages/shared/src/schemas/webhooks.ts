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
