import {
  type Result,
  type FizzyError,
  UserSchema,
  UserListSchema,
  type User,
  type UserList,
} from '@fizzy-mcp/shared';
import { BaseEndpoint } from './base.js';

/**
 * Endpoint for user-related operations.
 *
 * Users represent people who have access to an account.
 */
export class UsersEndpoint extends BaseEndpoint {
  /**
   * Lists all active users in the account.
   *
   * @example
   * ```typescript
   * const result = await client.users.list();
   * if (result.ok) {
   *   for (const user of result.value) {
   *     console.log(`${user.name} (${user.role})`);
   *   }
   * }
   * ```
   */
  async list(): Promise<Result<UserList, FizzyError>> {
    return this.get('/users', UserListSchema);
  }

  /**
   * Gets a specific user by ID.
   *
   * @param userId - The user's unique identifier
   *
   * @example
   * ```typescript
   * const result = await client.users.getById('user-id');
   * if (result.ok) {
   *   console.log('User:', result.value.name);
   *   console.log('Email:', result.value.email_address);
   * }
   * ```
   */
  async getById(userId: string): Promise<Result<User, FizzyError>> {
    return this.get(`/users/${userId}`, UserSchema);
  }
}
