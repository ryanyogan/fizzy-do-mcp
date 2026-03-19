/**
 * Tests for WebSocket authentication utilities.
 *
 * Uses dependency injection to test auth functions without making real HTTP requests.
 */

import { describe, it, expect, vi } from 'vite-plus/test';
import {
  validateFizzyToken,
  validateBoardAccess,
  createAuthHeaders,
  type AuthHttpClient,
  type AuthConfig,
} from '../websocket/auth.js';

/**
 * Creates a mock HTTP client for testing
 */
function createMockHttpClient(
  mockFetch: (url: string, init?: RequestInit) => Promise<Response>,
): AuthHttpClient {
  return { fetch: mockFetch };
}

/**
 * Creates a mock Response object
 */
function createMockResponse(data: unknown, ok = true, status = 200): Response {
  return {
    ok,
    status,
    json: async () => data,
    text: async () => JSON.stringify(data),
    headers: new Headers(),
  } as Response;
}

/**
 * Valid identity response matching the Fizzy API schema
 */
const validIdentityResponse = {
  accounts: [
    {
      id: 'account-123',
      name: "Test User's Account",
      slug: '/123456',
      created_at: '2024-01-01T00:00:00.000Z',
      user: {
        id: 'user-456',
        name: 'Test User',
        role: 'owner' as const,
        active: true,
        email_address: 'test@example.com',
        created_at: '2024-01-01T00:00:00.000Z',
        url: 'https://app.fizzy.do/users/user-456',
        avatar_url: 'https://app.fizzy.do/users/user-456/avatar',
      },
    },
  ],
};

describe('WebSocket Auth', () => {
  describe('createAuthHeaders', () => {
    it('creates headers with Bearer token', () => {
      const headers = createAuthHeaders('test-token');

      expect(headers).toEqual({
        Authorization: 'Bearer test-token',
        Accept: 'application/json',
      });
    });

    it('handles empty token', () => {
      const headers = createAuthHeaders('');

      expect(headers).toEqual({
        Authorization: 'Bearer ',
        Accept: 'application/json',
      });
    });
  });

  describe('validateFizzyToken', () => {
    it('returns user info for valid token', async () => {
      const mockFetch = vi.fn().mockResolvedValue(createMockResponse(validIdentityResponse));
      const config: AuthConfig = {
        baseUrl: 'https://test.fizzy.do',
        httpClient: createMockHttpClient(mockFetch),
      };

      const result = await validateFizzyToken('valid-token', config);

      expect(result).toEqual({
        id: 'user-456',
        email: 'test@example.com',
        name: 'Test User',
        accountSlug: '/123456',
        accountId: 'account-123',
      });
      expect(mockFetch).toHaveBeenCalledWith('https://test.fizzy.do/my/identity', {
        headers: createAuthHeaders('valid-token'),
      });
    });

    it('returns null for invalid token (401)', async () => {
      const mockFetch = vi
        .fn()
        .mockResolvedValue(createMockResponse({ error: 'unauthorized' }, false, 401));
      const config: AuthConfig = {
        baseUrl: 'https://test.fizzy.do',
        httpClient: createMockHttpClient(mockFetch),
      };

      const result = await validateFizzyToken('invalid-token', config);

      expect(result).toBeNull();
    });

    it('returns null for network errors', async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'));
      const config: AuthConfig = {
        baseUrl: 'https://test.fizzy.do',
        httpClient: createMockHttpClient(mockFetch),
      };

      const result = await validateFizzyToken('token', config);

      expect(result).toBeNull();
    });

    it('returns null for malformed response', async () => {
      const mockFetch = vi.fn().mockResolvedValue(createMockResponse({ invalid: 'data' }));
      const config: AuthConfig = {
        baseUrl: 'https://test.fizzy.do',
        httpClient: createMockHttpClient(mockFetch),
      };

      const result = await validateFizzyToken('token', config);

      expect(result).toBeNull();
    });

    it('returns null for empty accounts array', async () => {
      const mockFetch = vi.fn().mockResolvedValue(createMockResponse({ accounts: [] }));
      const config: AuthConfig = {
        baseUrl: 'https://test.fizzy.do',
        httpClient: createMockHttpClient(mockFetch),
      };

      const result = await validateFizzyToken('token', config);

      expect(result).toBeNull();
    });

    it('uses first account when multiple accounts exist', async () => {
      const multiAccountResponse = {
        accounts: [
          validIdentityResponse.accounts[0],
          {
            ...validIdentityResponse.accounts[0],
            id: 'account-999',
            name: 'Secondary Account',
            slug: '/999999',
          },
        ],
      };
      const mockFetch = vi.fn().mockResolvedValue(createMockResponse(multiAccountResponse));
      const config: AuthConfig = {
        baseUrl: 'https://test.fizzy.do',
        httpClient: createMockHttpClient(mockFetch),
      };

      const result = await validateFizzyToken('token', config);

      expect(result?.accountSlug).toBe('/123456');
      expect(result?.accountId).toBe('account-123');
    });
  });

  describe('validateBoardAccess', () => {
    it('returns true when user has board access', async () => {
      const mockFetch = vi
        .fn()
        .mockResolvedValue(createMockResponse({ id: 'board-123', name: 'Test Board' }));
      const config: AuthConfig = {
        baseUrl: 'https://test.fizzy.do',
        httpClient: createMockHttpClient(mockFetch),
      };

      const result = await validateBoardAccess('valid-token', 'board-123', '/123456', config);

      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith('https://test.fizzy.do/123456/boards/board-123', {
        headers: createAuthHeaders('valid-token'),
      });
    });

    it('returns false when board not found (404)', async () => {
      const mockFetch = vi
        .fn()
        .mockResolvedValue(createMockResponse({ error: 'not_found' }, false, 404));
      const config: AuthConfig = {
        baseUrl: 'https://test.fizzy.do',
        httpClient: createMockHttpClient(mockFetch),
      };

      const result = await validateBoardAccess('token', 'nonexistent-board', '/123456', config);

      expect(result).toBe(false);
    });

    it('returns false when access denied (403)', async () => {
      const mockFetch = vi
        .fn()
        .mockResolvedValue(createMockResponse({ error: 'forbidden' }, false, 403));
      const config: AuthConfig = {
        baseUrl: 'https://test.fizzy.do',
        httpClient: createMockHttpClient(mockFetch),
      };

      const result = await validateBoardAccess('token', 'private-board', '/123456', config);

      expect(result).toBe(false);
    });

    it('returns false for network errors', async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'));
      const config: AuthConfig = {
        baseUrl: 'https://test.fizzy.do',
        httpClient: createMockHttpClient(mockFetch),
      };

      const result = await validateBoardAccess('token', 'board-123', '/123456', config);

      expect(result).toBe(false);
    });

    it('constructs correct URL with account slug', async () => {
      const mockFetch = vi.fn().mockResolvedValue(createMockResponse({}));
      const config: AuthConfig = {
        baseUrl: 'https://app.fizzy.do',
        httpClient: createMockHttpClient(mockFetch),
      };

      await validateBoardAccess('token', 'my-board', '/6099243', config);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://app.fizzy.do/6099243/boards/my-board',
        expect.any(Object),
      );
    });
  });
});
