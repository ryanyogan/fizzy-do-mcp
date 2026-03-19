/**
 * WebSocket authentication utilities
 *
 * Validates Fizzy tokens using the shared schemas and constants.
 * Designed for testability with dependency injection.
 */

import {
  DEFAULT_CONFIG,
  IdentityResponseSchema,
  type Account,
} from '@fizzy-do-mcp/shared';

/**
 * User info returned from token validation
 */
export interface ValidatedUser {
  /** User ID */
  id: string;
  /** User email */
  email: string;
  /** Display name */
  name: string;
  /** Account slug (e.g., "/6099243") */
  accountSlug: string;
  /** Account ID */
  accountId: string;
}

/**
 * HTTP client interface for making requests.
 * Allows dependency injection for testing.
 */
export interface AuthHttpClient {
  fetch(url: string, init?: RequestInit): Promise<Response>;
}

/**
 * Default HTTP client using global fetch
 */
export const defaultHttpClient: AuthHttpClient = {
  fetch: globalThis.fetch.bind(globalThis),
};

/**
 * Configuration for auth functions
 */
export interface AuthConfig {
  /** Base URL for Fizzy API */
  baseUrl: string;
  /** HTTP client for making requests */
  httpClient: AuthHttpClient;
}

/**
 * Default auth configuration
 */
export const defaultAuthConfig: AuthConfig = {
  baseUrl: DEFAULT_CONFIG.baseUrl,
  httpClient: defaultHttpClient,
};

/**
 * Creates auth headers for Fizzy API requests
 */
export function createAuthHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/json',
  };
}

/**
 * Validate a Fizzy API token
 *
 * Makes a request to the Fizzy identity endpoint to verify the token
 * and extract user information using the shared schema.
 *
 * @param token - Fizzy personal access token
 * @param config - Optional auth configuration for DI
 * @returns User info if valid, null if invalid
 */
export async function validateFizzyToken(
  token: string,
  config: AuthConfig = defaultAuthConfig,
): Promise<ValidatedUser | null> {
  try {
    const response = await config.httpClient.fetch(
      `${config.baseUrl}/my/identity`,
      { headers: createAuthHeaders(token) },
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const parsed = IdentityResponseSchema.safeParse(data);

    if (!parsed.success || parsed.data.accounts.length === 0) {
      return null;
    }

    const account = parsed.data.accounts[0] as Account;

    return {
      id: account.user.id,
      email: account.user.email_address,
      name: account.user.name,
      accountSlug: account.slug,
      accountId: account.id,
    };
  } catch {
    return null;
  }
}

/**
 * Validate that a user has access to a specific board
 *
 * @param token - Fizzy personal access token
 * @param boardId - Board ID to check access for
 * @param accountSlug - Account slug (e.g., "/6099243")
 * @param config - Optional auth configuration for DI
 * @returns True if user has access, false otherwise
 */
export async function validateBoardAccess(
  token: string,
  boardId: string,
  accountSlug: string,
  config: AuthConfig = defaultAuthConfig,
): Promise<boolean> {
  try {
    const response = await config.httpClient.fetch(
      `${config.baseUrl}${accountSlug}/boards/${boardId}`,
      { headers: createAuthHeaders(token) },
    );

    return response.ok;
  } catch {
    return false;
  }
}
