import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { FizzyClient } from '@fizzy-do-mcp/client';
import { wrapToolOperation } from '../utils.js';

/**
 * Registers notification-related tools with the MCP server.
 *
 * Notifications alert users about activity in Fizzy, such as
 * card assignments, mentions, and comments.
 */
export function registerNotificationTools(server: McpServer, client: FizzyClient): void {
  // List Notifications
  server.tool(
    'fizzy_list_notifications',
    'List notifications for the current user.',
    {
      unread_only: z
        .boolean()
        .optional()
        .default(false)
        .describe('If true, only returns unread notifications'),
    },
    async ({ unread_only }) => {
      return wrapToolOperation(
        () => client.notifications.list(unread_only),
        (notifications) => {
          const unread = notifications.filter((n) => !n.read).length;
          return `Found ${notifications.length} notification(s) (${unread} unread)`;
        },
      );
    },
  );

  // Get Notification
  server.tool(
    'fizzy_get_notification',
    'Get details of a specific notification.',
    {
      notification_id: z.string().describe('The notification ID'),
    },
    async ({ notification_id }) => {
      return wrapToolOperation(
        () => client.notifications.getById(notification_id),
        'Notification retrieved',
      );
    },
  );

  // Get Notification Count
  server.tool(
    'fizzy_notification_count',
    'Get the count of notifications (total and unread).',
    {},
    async () => {
      return wrapToolOperation(
        () => client.notifications.count(),
        (count) => `${count.unread} unread of ${count.total} total notifications`,
      );
    },
  );

  // Mark Notification Read
  server.tool(
    'fizzy_mark_notification_read',
    'Mark a specific notification as read.',
    {
      notification_id: z.string().describe('The notification ID'),
    },
    async ({ notification_id }) => {
      return wrapToolOperation(
        () => client.notifications.markRead(notification_id),
        'Notification marked as read',
      );
    },
  );

  // Mark All Notifications Read
  server.tool(
    'fizzy_mark_all_notifications_read',
    'Mark all notifications as read.',
    {},
    async () => {
      return wrapToolOperation(
        () => client.notifications.markAllRead(),
        'All notifications marked as read',
      );
    },
  );
}
