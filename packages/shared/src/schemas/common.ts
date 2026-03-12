import { z } from 'zod';

/**
 * Common schema for user objects returned by the Fizzy API.
 */
export const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.enum(['owner', 'admin', 'member']),
  active: z.boolean(),
  email_address: z.string().email(),
  created_at: z.string().datetime({ offset: true }),
  url: z.string().url(),
  avatar_url: z.string().url().optional(),
});

export type User = z.infer<typeof UserSchema>;

/**
 * Schema for column color objects.
 */
export const ColumnColorSchema = z.object({
  name: z.string(),
  value: z.string(),
});

export type ColumnColor = z.infer<typeof ColumnColorSchema>;

/**
 * Schema for step (todo item) objects on cards.
 */
export const StepSchema = z.object({
  id: z.string(),
  content: z.string(),
  completed: z.boolean(),
});

export type Step = z.infer<typeof StepSchema>;

/**
 * Available column colors in Fizzy.
 */
export const COLUMN_COLORS = {
  Blue: 'var(--color-card-default)',
  Gray: 'var(--color-card-1)',
  Tan: 'var(--color-card-2)',
  Yellow: 'var(--color-card-3)',
  Lime: 'var(--color-card-4)',
  Aqua: 'var(--color-card-5)',
  Violet: 'var(--color-card-6)',
  Purple: 'var(--color-card-7)',
  Pink: 'var(--color-card-8)',
} as const;

export type ColumnColorName = keyof typeof COLUMN_COLORS;
export type ColumnColorValue = (typeof COLUMN_COLORS)[ColumnColorName];

/**
 * Schema for column color value validation.
 */
export const ColumnColorValueSchema = z.enum([
  'var(--color-card-default)',
  'var(--color-card-1)',
  'var(--color-card-2)',
  'var(--color-card-3)',
  'var(--color-card-4)',
  'var(--color-card-5)',
  'var(--color-card-6)',
  'var(--color-card-7)',
  'var(--color-card-8)',
]);
