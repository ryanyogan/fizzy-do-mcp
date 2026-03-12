import { z } from 'zod';
import { UserSchema } from './common.js';

/**
 * Schema for account objects in the identity response.
 */
export const AccountSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  created_at: z.string().datetime({ offset: true }),
  user: UserSchema,
});

export type Account = z.infer<typeof AccountSchema>;

/**
 * Schema for the GET /my/identity response.
 */
export const IdentityResponseSchema = z.object({
  accounts: z.array(AccountSchema),
});

export type IdentityResponse = z.infer<typeof IdentityResponseSchema>;

/**
 * Schema for the GET /account/settings response.
 */
export const AccountSettingsSchema = z.object({
  id: z.string(),
  name: z.string(),
  cards_count: z.number(),
  created_at: z.string().datetime({ offset: true }),
  auto_postpone_period_in_days: z.number().nullable(),
});

export type AccountSettings = z.infer<typeof AccountSettingsSchema>;
