import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { FizzyClient } from '@fizzy-do-mcp/client';
import { WEBHOOK_EVENTS } from '@fizzy-do-mcp/shared';
import { wrapToolOperation } from '../utils.js';

/**
 * Registers webhook-related tools with the MCP server.
 *
 * Webhooks allow receiving real-time notifications when events occur in Fizzy.
 * These tools require administrator privileges - non-admin users will receive
 * a 403 Forbidden error.
 */
export function registerWebhookTools(server: McpServer, client: FizzyClient): void {
  // List Webhooks
  server.tool(
    'fizzy_list_webhooks',
    'List all webhooks configured for the account. Requires admin privileges.',
    {},
    async () => {
      return wrapToolOperation(
        () => client.webhooks.list(),
        (webhooks) => `Found ${webhooks.length} webhook(s)`,
      );
    },
  );

  // Get Webhook
  server.tool(
    'fizzy_get_webhook',
    'Get details of a specific webhook by its ID. Requires admin privileges.',
    {
      webhook_id: z.string().describe('The unique identifier of the webhook'),
    },
    async ({ webhook_id }) => {
      return wrapToolOperation(() => client.webhooks.getById(webhook_id), 'Webhook retrieved');
    },
  );

  // Create Webhook
  server.tool(
    'fizzy_create_webhook',
    `Create a new webhook to receive event notifications. Requires admin privileges. Available events: ${WEBHOOK_EVENTS.join(', ')}`,
    {
      url: z.string().url().describe('The URL that will receive webhook deliveries'),
      events: z
        .array(z.enum(WEBHOOK_EVENTS))
        .min(1)
        .describe('Events that will trigger the webhook'),
      active: z.boolean().optional().default(true).describe('Whether the webhook is active'),
    },
    async ({ url, events, active }) => {
      return wrapToolOperation(
        () =>
          client.webhooks.create({
            url,
            events,
            active,
          }),
        (webhook) => `Created webhook ${webhook.id} for ${events.length} event(s)`,
      );
    },
  );

  // Update Webhook
  server.tool(
    'fizzy_update_webhook',
    'Update an existing webhook. Requires admin privileges.',
    {
      webhook_id: z.string().describe('The unique identifier of the webhook'),
      url: z.string().url().optional().describe('New URL for webhook deliveries'),
      events: z
        .array(z.enum(WEBHOOK_EVENTS))
        .min(1)
        .optional()
        .describe('New events that will trigger the webhook'),
      active: z.boolean().optional().describe('Whether the webhook is active'),
    },
    async ({ webhook_id, url, events, active }) => {
      return wrapToolOperation(
        () =>
          client.webhooks.update(webhook_id, {
            url,
            events,
            active,
          }),
        'Webhook updated successfully',
      );
    },
  );

  // Delete Webhook
  server.tool(
    'fizzy_delete_webhook',
    'Delete a webhook. Requires admin privileges. This action is irreversible.',
    {
      webhook_id: z.string().describe('The unique identifier of the webhook to delete'),
    },
    async ({ webhook_id }) => {
      return wrapToolOperation(() => client.webhooks.deleteWebhook(webhook_id), 'Webhook deleted');
    },
  );

  // Test Webhook
  server.tool(
    'fizzy_test_webhook',
    'Send a test delivery to a webhook to verify it is configured correctly. Requires admin privileges.',
    {
      webhook_id: z.string().describe('The unique identifier of the webhook to test'),
    },
    async ({ webhook_id }) => {
      return wrapToolOperation(
        () => client.webhooks.test(webhook_id),
        (result) => {
          if (result.success) {
            return `Webhook test successful (${result.response_time_ms}ms)`;
          }
          return `Webhook test failed: ${result.error}`;
        },
      );
    },
  );
}
