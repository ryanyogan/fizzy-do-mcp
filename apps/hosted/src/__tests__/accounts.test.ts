/**
 * Tests for Account API handler.
 *
 * Tests webhook secret management endpoints including authentication,
 * validation, and KV storage operations.
 */

import { describe, it, expect, vi, beforeEach } from 'vite-plus/test';
import { Hono } from 'hono';
import type { HonoEnv } from '../types';

/**
 * Helper to parse JSON response with proper typing
 */
async function parseJson(res: Response): Promise<Record<string, unknown>> {
  return (await res.json()) as Record<string, unknown>;
}

// Mock the auth module
vi.mock('../websocket/auth', () => ({
  validateFizzyToken: vi.fn(),
}));

import { validateFizzyToken } from '../websocket/auth';
import { accountRoutes } from '../accounts/handler';

const mockValidateFizzyToken = vi.mocked(validateFizzyToken);

/**
 * Creates a mock KV namespace for testing
 */
function createMockKV() {
  const store = new Map<string, string>();

  return {
    get: vi.fn(async (key: string, type?: 'json' | 'text') => {
      const value = store.get(key);
      if (!value) return null;
      return type === 'json' ? JSON.parse(value) : value;
    }),
    put: vi.fn(async (key: string, value: string) => {
      store.set(key, value);
    }),
    delete: vi.fn(async (key: string) => {
      store.delete(key);
    }),
    // Expose store for test verification
    _store: store,
  };
}

/**
 * Creates a test app with mocked environment
 */
function createTestApp(kvStore?: ReturnType<typeof createMockKV>) {
  const app = new Hono<HonoEnv>();
  const kv = kvStore ?? createMockKV();

  app.use('*', async (c, next) => {
    c.env = {
      WEBHOOK_SECRETS: kv as unknown as KVNamespace,
    } as HonoEnv['Bindings'];
    await next();
  });

  app.route('/accounts', accountRoutes);

  return { app, kv };
}

/**
 * Valid user info returned from auth validation
 */
const validUser = {
  id: 'user-456',
  email: 'test@example.com',
  name: 'Test User',
  accountSlug: '/123456',
  accountId: 'account-123',
};

describe('Account API Handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /accounts/webhook-secret', () => {
    it('returns 401 without Authorization header', async () => {
      const { app } = createTestApp();

      const res = await app.request('/accounts/webhook-secret', {
        method: 'GET',
      });

      expect(res.status).toBe(401);
      const body = await parseJson(res);
      expect(body.error).toBe('unauthorized');
      expect(body.message).toContain('Authorization');
    });

    it('returns 401 with non-Bearer auth', async () => {
      const { app } = createTestApp();

      const res = await app.request('/accounts/webhook-secret', {
        method: 'GET',
        headers: { Authorization: 'Basic dXNlcjpwYXNz' },
      });

      expect(res.status).toBe(401);
    });

    it('returns 401 with invalid token', async () => {
      mockValidateFizzyToken.mockResolvedValue(null);
      const { app } = createTestApp();

      const res = await app.request('/accounts/webhook-secret', {
        method: 'GET',
        headers: { Authorization: 'Bearer invalid-token' },
      });

      expect(res.status).toBe(401);
      const body = await parseJson(res);
      expect(body.error).toBe('unauthorized');
      expect(body.message).toContain('Invalid Fizzy token');
    });

    it('returns configured: false when no secret exists', async () => {
      mockValidateFizzyToken.mockResolvedValue(validUser);
      const { app, kv } = createTestApp();

      const res = await app.request('/accounts/webhook-secret', {
        method: 'GET',
        headers: { Authorization: 'Bearer valid-token' },
      });

      expect(res.status).toBe(200);
      const body = await parseJson(res);
      expect(body).toEqual({
        configured: false,
        account_slug: '/123456',
        account_name: 'Test User',
        created_at: undefined,
        updated_at: undefined,
      });
      expect(kv.get).toHaveBeenCalledWith('/123456', 'json');
    });

    it('returns configured: true when secret exists', async () => {
      mockValidateFizzyToken.mockResolvedValue(validUser);
      const kv = createMockKV();
      const entry = {
        secret: 'webhook-secret-123',
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-02T00:00:00.000Z',
      };
      kv._store.set('/123456', JSON.stringify(entry));
      const { app } = createTestApp(kv);

      const res = await app.request('/accounts/webhook-secret', {
        method: 'GET',
        headers: { Authorization: 'Bearer valid-token' },
      });

      expect(res.status).toBe(200);
      const body = await parseJson(res);
      expect(body).toEqual({
        configured: true,
        account_slug: '/123456',
        account_name: 'Test User',
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-02T00:00:00.000Z',
      });
    });

    it('does not expose the actual secret value', async () => {
      mockValidateFizzyToken.mockResolvedValue(validUser);
      const kv = createMockKV();
      kv._store.set(
        '/123456',
        JSON.stringify({
          secret: 'super-secret-value',
          created_at: '2024-01-01T00:00:00.000Z',
          updated_at: '2024-01-01T00:00:00.000Z',
        }),
      );
      const { app } = createTestApp(kv);

      const res = await app.request('/accounts/webhook-secret', {
        method: 'GET',
        headers: { Authorization: 'Bearer valid-token' },
      });

      const body = await parseJson(res);
      expect(body.secret).toBeUndefined();
      expect(JSON.stringify(body)).not.toContain('super-secret-value');
    });
  });

  describe('POST /accounts/webhook-secret', () => {
    it('returns 401 without auth', async () => {
      const { app } = createTestApp();

      const res = await app.request('/accounts/webhook-secret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret: 'test' }),
      });

      expect(res.status).toBe(401);
    });

    it('returns 400 for invalid JSON', async () => {
      mockValidateFizzyToken.mockResolvedValue(validUser);
      const { app } = createTestApp();

      const res = await app.request('/accounts/webhook-secret', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer valid-token',
          'Content-Type': 'application/json',
        },
        body: 'not json',
      });

      expect(res.status).toBe(400);
      const body = await parseJson(res);
      expect(body.error).toBe('invalid_json');
    });

    it('returns 400 for missing secret', async () => {
      mockValidateFizzyToken.mockResolvedValue(validUser);
      const { app } = createTestApp();

      const res = await app.request('/accounts/webhook-secret', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer valid-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      expect(res.status).toBe(400);
      const body = await parseJson(res);
      expect(body.error).toBe('validation_error');
    });

    it('returns 400 for empty secret', async () => {
      mockValidateFizzyToken.mockResolvedValue(validUser);
      const { app } = createTestApp();

      const res = await app.request('/accounts/webhook-secret', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer valid-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ secret: '' }),
      });

      expect(res.status).toBe(400);
      const body = await parseJson(res);
      expect(body.error).toBe('validation_error');
    });

    it('stores new secret and returns 201', async () => {
      mockValidateFizzyToken.mockResolvedValue(validUser);
      const { app, kv } = createTestApp();

      const res = await app.request('/accounts/webhook-secret', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer valid-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ secret: 'new-webhook-secret' }),
      });

      expect(res.status).toBe(201);
      const body = await parseJson(res);
      expect(body.configured).toBe(true);
      expect(body.account_slug).toBe('/123456');
      expect(body.created_at).toBeDefined();
      expect(body.updated_at).toBeDefined();

      // Verify KV was called
      expect(kv.put).toHaveBeenCalledWith('/123456', expect.any(String));
      const storedValue = JSON.parse(kv.put.mock.calls[0]![1]);
      expect(storedValue.secret).toBe('new-webhook-secret');
    });

    it('updates existing secret and returns 200', async () => {
      mockValidateFizzyToken.mockResolvedValue(validUser);
      const kv = createMockKV();
      const existingEntry = {
        secret: 'old-secret',
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z',
      };
      kv._store.set('/123456', JSON.stringify(existingEntry));
      const { app } = createTestApp(kv);

      const res = await app.request('/accounts/webhook-secret', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer valid-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ secret: 'updated-secret' }),
      });

      expect(res.status).toBe(200);
      const body = await parseJson(res);
      expect(body.configured).toBe(true);
      // Should preserve original created_at
      expect(body.created_at).toBe('2024-01-01T00:00:00.000Z');
      // updated_at should be newer
      expect(body.updated_at).not.toBe('2024-01-01T00:00:00.000Z');

      // Verify stored value
      const storedValue = JSON.parse(kv.put.mock.calls[0]![1]);
      expect(storedValue.secret).toBe('updated-secret');
      expect(storedValue.created_at).toBe('2024-01-01T00:00:00.000Z');
    });
  });

  describe('DELETE /accounts/webhook-secret', () => {
    it('returns 401 without auth', async () => {
      const { app } = createTestApp();

      const res = await app.request('/accounts/webhook-secret', {
        method: 'DELETE',
      });

      expect(res.status).toBe(401);
    });

    it('returns 404 when no secret exists', async () => {
      mockValidateFizzyToken.mockResolvedValue(validUser);
      const { app } = createTestApp();

      const res = await app.request('/accounts/webhook-secret', {
        method: 'DELETE',
        headers: { Authorization: 'Bearer valid-token' },
      });

      expect(res.status).toBe(404);
      const body = await parseJson(res);
      expect(body.error).toBe('not_found');
    });

    it('deletes existing secret and returns success', async () => {
      mockValidateFizzyToken.mockResolvedValue(validUser);
      const kv = createMockKV();
      kv._store.set('/123456', JSON.stringify({ secret: 'to-delete' }));
      const { app } = createTestApp(kv);

      const res = await app.request('/accounts/webhook-secret', {
        method: 'DELETE',
        headers: { Authorization: 'Bearer valid-token' },
      });

      expect(res.status).toBe(200);
      const body = await parseJson(res);
      expect(body.deleted).toBe(true);
      expect(body.account_slug).toBe('/123456');

      // Verify KV delete was called
      expect(kv.delete).toHaveBeenCalledWith('/123456');
    });
  });

  describe('Auth isolation', () => {
    it('uses account slug from authenticated user, not request', async () => {
      // User is authenticated for account /123456
      mockValidateFizzyToken.mockResolvedValue(validUser);
      const { app, kv } = createTestApp();

      // Even if someone tries to manipulate headers or body,
      // we always use the authenticated user's account
      const res = await app.request('/accounts/webhook-secret', {
        method: 'GET',
        headers: { Authorization: 'Bearer valid-token' },
      });

      expect(res.status).toBe(200);
      // KV lookup should use the authenticated user's account slug
      expect(kv.get).toHaveBeenCalledWith('/123456', 'json');
    });

    it('different users access different account secrets', async () => {
      const kv = createMockKV();
      // Set up secrets for two different accounts
      kv._store.set(
        '/account-a',
        JSON.stringify({
          secret: 'secret-a',
          created_at: '2024-01-01T00:00:00.000Z',
          updated_at: '2024-01-01T00:00:00.000Z',
        }),
      );
      kv._store.set(
        '/account-b',
        JSON.stringify({
          secret: 'secret-b',
          created_at: '2024-01-01T00:00:00.000Z',
          updated_at: '2024-01-01T00:00:00.000Z',
        }),
      );
      const { app } = createTestApp(kv);

      // User A checks their secret
      mockValidateFizzyToken.mockResolvedValue({ ...validUser, accountSlug: '/account-a' });
      const resA = await app.request('/accounts/webhook-secret', {
        method: 'GET',
        headers: { Authorization: 'Bearer token-a' },
      });
      expect(resA.status).toBe(200);
      const bodyA = await parseJson(resA);
      expect(bodyA.configured).toBe(true);
      expect(bodyA.account_slug).toBe('/account-a');

      // User B checks their secret
      mockValidateFizzyToken.mockResolvedValue({ ...validUser, accountSlug: '/account-b' });
      const resB = await app.request('/accounts/webhook-secret', {
        method: 'GET',
        headers: { Authorization: 'Bearer token-b' },
      });
      expect(resB.status).toBe(200);
      const bodyB = await parseJson(resB);
      expect(bodyB.configured).toBe(true);
      expect(bodyB.account_slug).toBe('/account-b');

      // User C has no secret configured
      mockValidateFizzyToken.mockResolvedValue({ ...validUser, accountSlug: '/account-c' });
      const resC = await app.request('/accounts/webhook-secret', {
        method: 'GET',
        headers: { Authorization: 'Bearer token-c' },
      });
      expect(resC.status).toBe(200);
      const bodyC = await parseJson(resC);
      expect(bodyC.configured).toBe(false);
      expect(bodyC.account_slug).toBe('/account-c');
    });
  });
});
