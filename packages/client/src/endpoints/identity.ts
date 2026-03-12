import {
  type Result,
  type FizzyError,
  IdentityResponseSchema,
  AccountSettingsSchema,
  type IdentityResponse,
  type AccountSettings,
} from '@fizzy-mcp/shared';
import { GlobalEndpoint, BaseEndpoint, type EndpointContext } from './base.js';
import type { HttpClient } from '../http/types.js';

/**
 * Endpoint for identity-related operations.
 *
 * The identity endpoint is unique because it doesn't require an account slug
 * and is used to discover the user's accounts.
 */
export class IdentityEndpoint extends GlobalEndpoint {
  constructor(http: HttpClient) {
    // Use empty account slug since identity endpoints don't need it
    super({ http, accountSlug: '' });
  }

  /**
   * Gets the current user's identity, including all accessible accounts.
   *
   * This is typically the first call made to discover the user's accounts
   * and auto-detect the account slug.
   *
   * @example
   * ```typescript
   * const result = await client.identity.getIdentity();
   * if (result.ok) {
   *   console.log('Accounts:', result.value.accounts);
   * }
   * ```
   */
  async getIdentity(): Promise<Result<IdentityResponse, FizzyError>> {
    return super.get('/my/identity', IdentityResponseSchema);
  }
}

/**
 * Endpoint for account-related operations.
 */
export class AccountEndpoint extends BaseEndpoint {
  constructor(context: EndpointContext) {
    super(context);
  }

  /**
   * Gets the current account's settings.
   *
   * @example
   * ```typescript
   * const result = await client.account.getSettings();
   * if (result.ok) {
   *   console.log('Account:', result.value.name);
   *   console.log('Cards:', result.value.cards_count);
   * }
   * ```
   */
  async getSettings(): Promise<Result<AccountSettings, FizzyError>> {
    // Note: This endpoint uses a different path structure
    return this.get('/account/settings', AccountSettingsSchema);
  }

  /**
   * Updates the account's auto-postpone period.
   *
   * @param autoPostponePeriodInDays - Number of days before cards auto-postpone
   */
  async updateEntropy(
    autoPostponePeriodInDays: number,
  ): Promise<Result<AccountSettings, FizzyError>> {
    return this.put('/account/entropy', AccountSettingsSchema, {
      entropy: { auto_postpone_period_in_days: autoPostponePeriodInDays },
    });
  }

  protected override buildPath(path: string): string {
    // Account settings endpoints don't use the account slug prefix
    return path.startsWith('/') ? path : `/${path}`;
  }
}
