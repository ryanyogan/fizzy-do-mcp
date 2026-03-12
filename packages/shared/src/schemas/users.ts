import { z } from 'zod';
import { UserSchema } from './common.js';

/**
 * Schema for the list of users response.
 */
export const UserListSchema = z.array(UserSchema);

export type UserList = z.infer<typeof UserListSchema>;

// Re-export User type from common for convenience
export type { User } from './common.js';
