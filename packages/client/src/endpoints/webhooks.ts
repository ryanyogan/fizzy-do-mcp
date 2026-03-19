import {
  type Result,
  type FizzyError,
  WebhookSchema,
  WebhookListSchema,
  WebhookTestResponseSchema,
  type Webhook,
  type WebhookList,
  type CreateWebhookInput,
  type UpdateWebhookInput,
  type WebhookTestResponse,
} from '@fizzy-do-mcp/shared';
import { BaseEndpoint } from './base.js';

/**
 * Endpoint for webhook operations.
 *
 * Webhooks allow you to receive real-time notifications when events
 * occur in Fizzy. Only account administrators can manage webhooks.
 *
 * @remarks
 * All webhook operations require admin privileges. Non-admin users
 * will receive a 403 Forbidden error.
 */
export class WebhooksEndpoint extends BaseEndpoint {
  /**
   * Lists all webhooks configured for the account.
   *
   * @returns List of all webhooks
   *
   * @example
   * ```typescript
   * const result = await client.webhooks.list();
   * if (result.ok) {
   *   for (const webhook of result.value) {
   *     console.log(`${webhook.url} - ${webhook.events.join(', ')}`);
   *   }
   * }
   * ```
   */
  async list(): Promise<Result<WebhookList, FizzyError>> {
    return this.get('/webhooks', WebhookListSchema);
  }

  /**
   * Gets a specific webhook by ID.
   *
   * @param webhookId - The webhook's unique identifier
   *
   * @example
   * ```typescript
   * const result = await client.webhooks.getById('webhook-123');
   * if (result.ok) {
   *   console.log('Webhook URL:', result.value.url);
   * }
   * ```
   */
  async getById(webhookId: string): Promise<Result<Webhook, FizzyError>> {
    return this.get(`/webhooks/${webhookId}`, WebhookSchema);
  }

  /**
   * Creates a new webhook.
   *
   * @param input - Webhook creation parameters
   *
   * @example
   * ```typescript
   * const result = await client.webhooks.create({
   *   url: 'https://example.com/webhook',
   *   events: ['card_created', 'card_closed'],
   *   active: true,
   * });
   * if (result.ok) {
   *   console.log('Created webhook:', result.value.id);
   *   console.log('Secret:', result.value.secret);
   * }
   * ```
   */
  async create(input: CreateWebhookInput): Promise<Result<Webhook, FizzyError>> {
    return this.post('/webhooks', WebhookSchema, { webhook: input });
  }

  /**
   * Updates a webhook.
   *
   * @param webhookId - The webhook's unique identifier
   * @param input - Webhook update parameters
   *
   * @example
   * ```typescript
   * const result = await client.webhooks.update('webhook-123', {
   *   active: false,
   * });
   * ```
   */
  async update(webhookId: string, input: UpdateWebhookInput): Promise<Result<void, FizzyError>> {
    return this.putNoContent(`/webhooks/${webhookId}`, { webhook: input });
  }

  /**
   * Deletes a webhook.
   *
   * @param webhookId - The webhook's unique identifier
   *
   * @example
   * ```typescript
   * const result = await client.webhooks.deleteWebhook('webhook-123');
   * if (result.ok) {
   *   console.log('Webhook deleted');
   * }
   * ```
   */
  async deleteWebhook(webhookId: string): Promise<Result<void, FizzyError>> {
    return this.delete(`/webhooks/${webhookId}`);
  }

  /**
   * Sends a test delivery to a webhook.
   *
   * This sends a test event to the webhook URL to verify it's
   * configured correctly and can receive events.
   *
   * @param webhookId - The webhook's unique identifier
   *
   * @example
   * ```typescript
   * const result = await client.webhooks.test('webhook-123');
   * if (result.ok) {
   *   if (result.value.success) {
   *     console.log('Webhook test successful');
   *   } else {
   *     console.log('Test failed:', result.value.error);
   *   }
   * }
   * ```
   */
  async test(webhookId: string): Promise<Result<WebhookTestResponse, FizzyError>> {
    return this.post(`/webhooks/${webhookId}/test`, WebhookTestResponseSchema);
  }
}
