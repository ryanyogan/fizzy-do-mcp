import {
  type Result,
  type FizzyError,
  NotificationSchema,
  NotificationListSchema,
  NotificationCountSchema,
  type Notification,
  type NotificationList,
  type NotificationCount,
} from '@fizzy-do-mcp/shared';
import { BaseEndpoint } from './base.js';

/**
 * Endpoint for notification operations.
 *
 * Notifications alert users about activity in Fizzy, such as
 * card assignments, mentions, and comments.
 */
export class NotificationsEndpoint extends BaseEndpoint {
  /**
   * Lists all notifications for the current user.
   *
   * @param unreadOnly - If true, only returns unread notifications
   *
   * @example
   * ```typescript
   * const result = await client.notifications.list();
   * if (result.ok) {
   *   for (const notification of result.value) {
   *     console.log(`${notification.type}: ${notification.message}`);
   *   }
   * }
   * ```
   */
  async list(unreadOnly?: boolean): Promise<Result<NotificationList, FizzyError>> {
    const params = unreadOnly ? { unread: 'true' } : undefined;
    return this.get('/notifications', NotificationListSchema, params);
  }

  /**
   * Gets a specific notification by ID.
   *
   * @param notificationId - The notification's unique identifier
   *
   * @example
   * ```typescript
   * const result = await client.notifications.getById('notification-123');
   * if (result.ok) {
   *   console.log('Notification:', result.value.message);
   * }
   * ```
   */
  async getById(notificationId: string): Promise<Result<Notification, FizzyError>> {
    return this.get(`/notifications/${notificationId}`, NotificationSchema);
  }

  /**
   * Gets the count of notifications.
   *
   * @example
   * ```typescript
   * const result = await client.notifications.count();
   * if (result.ok) {
   *   console.log(`${result.value.unread} unread notifications`);
   * }
   * ```
   */
  async count(): Promise<Result<NotificationCount, FizzyError>> {
    return this.get('/notifications/count', NotificationCountSchema);
  }

  /**
   * Marks a notification as read.
   *
   * @param notificationId - The notification's unique identifier
   *
   * @example
   * ```typescript
   * const result = await client.notifications.markRead('notification-123');
   * if (result.ok) {
   *   console.log('Notification marked as read');
   * }
   * ```
   */
  async markRead(notificationId: string): Promise<Result<void, FizzyError>> {
    return this.postNoContent(`/notifications/${notificationId}/read`);
  }

  /**
   * Marks all notifications as read.
   *
   * @example
   * ```typescript
   * const result = await client.notifications.markAllRead();
   * if (result.ok) {
   *   console.log('All notifications marked as read');
   * }
   * ```
   */
  async markAllRead(): Promise<Result<void, FizzyError>> {
    return this.postNoContent('/notifications/read_all');
  }
}
