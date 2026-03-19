/**
 * WebSocket upgrade handling for Vibe Coding connections
 *
 * Route: GET /vibe/ws
 *
 * Accepts WebSocket connections from local vibe sessions and
 * forwards them to the SessionRegistry Durable Object.
 */

import { Hono } from 'hono';
import type { HonoEnv } from '../types';
import { validateFizzyToken, validateBoardAccess } from './auth';
import { ERROR_CODES } from '@fizzy-do-mcp/shared';

/**
 * WebSocket routes for vibe coding
 */
export const vibeRoutes = new Hono<HonoEnv>();

/**
 * WebSocket upgrade endpoint
 *
 * GET /vibe/ws
 *
 * Query params:
 * - token: Fizzy API token (required)
 * - board_id: Board ID to connect to (required)
 * - repo_path: Local repository path (required)
 *
 * The WebSocket is managed by the SessionRegistry Durable Object.
 */
vibeRoutes.get('/ws', async (c) => {
  // Check for WebSocket upgrade (case-insensitive per HTTP spec)
  const upgradeHeader = c.req.header('Upgrade');
  if (upgradeHeader?.toLowerCase() !== 'websocket') {
    return c.json({ error: 'Expected WebSocket upgrade' }, 426);
  }

  // Get required query params
  const token = c.req.query('token');
  const boardId = c.req.query('board_id');
  const repoPath = c.req.query('repo_path');

  if (!token || !boardId || !repoPath) {
    return c.json(
      {
        error: 'missing_parameters',
        message: 'token, board_id, and repo_path query parameters are required',
      },
      400,
    );
  }

  // Validate the token
  const user = await validateFizzyToken(token);
  if (!user) {
    return c.json(
      {
        error: ERROR_CODES.AUTH_FAILED,
        message: 'Invalid Fizzy token',
      },
      401,
    );
  }

  // Validate board access (requires account slug from validated user)
  const hasAccess = await validateBoardAccess(token, boardId, user.accountSlug);
  if (!hasAccess) {
    return c.json(
      {
        error: ERROR_CODES.BOARD_NOT_FOUND,
        message: 'Board not found or access denied',
      },
      403,
    );
  }

  // Get the session registry for this account
  const registryId = c.env.SESSION_REGISTRY.idFromName(user.accountSlug);
  const registry = c.env.SESSION_REGISTRY.get(registryId);

  // Forward the original request to the Durable Object, preserving WebSocket headers
  // (Sec-WebSocket-Key, Sec-WebSocket-Version, Connection, Upgrade, etc.)
  // Add session info in custom headers since we can't use body with WebSocket
  const sessionId = crypto.randomUUID();
  const originalHeaders = new Headers(c.req.raw.headers);

  // Add session info headers
  originalHeaders.set('X-Session-Id', sessionId);
  originalHeaders.set('X-Board-Id', boardId);
  originalHeaders.set('X-Repo-Path', repoPath);
  originalHeaders.set('X-User-Id', user.id);
  originalHeaders.set('X-Account-Slug', user.accountSlug);

  // Create request to DO with original WebSocket headers + session info
  const doRequest = new Request('https://internal/connect', {
    method: c.req.method,
    headers: originalHeaders,
  });

  // Forward to the Durable Object
  return registry.fetch(doRequest);
});

/**
 * Health check for vibe WebSocket service
 */
vibeRoutes.get('/health', (c) => {
  return c.json({
    status: 'ok',
    service: 'vibe-websocket',
    timestamp: new Date().toISOString(),
  });
});

/**
 * Get queue status for a board
 */
vibeRoutes.get('/boards/:boardId/queue', async (c) => {
  const boardId = c.req.param('boardId');
  const token = c.req.header('X-Fizzy-Token');

  if (!token) {
    return c.json({ error: 'missing_token', message: 'X-Fizzy-Token header required' }, 401);
  }

  // Validate token and board access
  const user = await validateFizzyToken(token);
  if (!user) {
    return c.json({ error: ERROR_CODES.AUTH_FAILED, message: 'Invalid token' }, 401);
  }

  const hasAccess = await validateBoardAccess(token, boardId, user.accountSlug);
  if (!hasAccess) {
    return c.json({ error: ERROR_CODES.BOARD_NOT_FOUND, message: 'Board not found' }, 403);
  }

  // Get queue status from the Work Queue DO
  const queueId = c.env.WORK_QUEUE.idFromName(boardId);
  const queue = c.env.WORK_QUEUE.get(queueId);

  const response = await queue.fetch('https://internal/status');
  const status = await response.json();

  return c.json(status);
});

/**
 * Get lock status for a card
 */
vibeRoutes.get('/cards/:cardNumber/lock', async (c) => {
  const cardNumber = parseInt(c.req.param('cardNumber'), 10);
  const token = c.req.header('X-Fizzy-Token');

  if (!token) {
    return c.json({ error: 'missing_token', message: 'X-Fizzy-Token header required' }, 401);
  }

  // Validate token
  const user = await validateFizzyToken(token);
  if (!user) {
    return c.json({ error: ERROR_CODES.AUTH_FAILED, message: 'Invalid token' }, 401);
  }

  // Get lock status from the Card Lock DO
  const lockId = c.env.CARD_LOCK.idFromName('global');
  const lock = c.env.CARD_LOCK.get(lockId);

  const response = await lock.fetch(`https://internal/owner?cardNumber=${cardNumber}`);
  const data = (await response.json()) as { owner: string | null };

  return c.json({
    cardNumber,
    locked: data.owner !== null,
    owner: data.owner,
  });
});
