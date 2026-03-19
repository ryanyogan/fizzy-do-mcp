import { z } from 'zod';
import { UserSchema } from './common.js';

/**
 * Notification types.
 */
export const NotificationTypeSchema = z.enum([
  'card_assigned',
  'card_mentioned',
  'comment_added',
  'card_closed',
  'card_reopened',
  'card_triaged',
]);

export type NotificationType = z.infer<typeof NotificationTypeSchema>;

/**
 * Schema for a notification object.
 */
export const NotificationSchema = z.object({
  id: z.string(),
  type: NotificationTypeSchema,
  read: z.boolean(),
  actor: UserSchema.optional(),
  card_number: z.number().optional(),
  card_title: z.string().optional(),
  board_id: z.string().optional(),
  board_name: z.string().optional(),
  message: z.string().optional(),
  created_at: z.string(),
});

export type Notification = z.infer<typeof NotificationSchema>;

/**
 * Schema for notification list response.
 */
export const NotificationListSchema = z.array(NotificationSchema);

export type NotificationList = z.infer<typeof NotificationListSchema>;

/**
 * Schema for notification count response.
 */
export const NotificationCountSchema = z.object({
  unread: z.number(),
  total: z.number(),
});

export type NotificationCount = z.infer<typeof NotificationCountSchema>;
