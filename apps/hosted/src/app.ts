import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';
import type { HonoEnv } from './types';
import { apiRoutes } from './api';
import { mcpRoutes } from './mcp/handler';
import { vibeRoutes } from './websocket/handler';
import { webhookRoutes } from './webhooks';
import { fizzyTokenMiddleware } from './middleware/fizzy-token';
import { loggingMiddleware, errorLoggingMiddleware } from './middleware/logging';

/**
 * Create the Hono application
 *
 * Simplified version - no auth, no rate limiting
 * Just proxies MCP requests to Fizzy API using user's token
 */
export function createApp() {
  const app = new Hono<HonoEnv>();

  // Global middleware
  app.use('*', errorLoggingMiddleware);
  app.use('*', loggingMiddleware);
  app.use('*', secureHeaders());
  app.use(
    '*',
    cors({
      origin: '*', // Allow all origins for open source
      allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowHeaders: ['Content-Type', 'X-Fizzy-Token', 'X-Fizzy-Account-Slug'],
      exposeHeaders: ['X-Request-Id'],
      credentials: false,
      maxAge: 86400,
    }),
  );

  // Request ID and Fizzy token extraction
  app.use('*', async (c, next) => {
    c.set('requestId', crypto.randomUUID());
    await next();
  });
  app.use('*', fizzyTokenMiddleware);

  // Root endpoint
  app.get('/', (c) => {
    return c.json({
      name: 'Fizzy MCP',
      version: '0.2.0',
      description: 'Open source MCP server for Fizzy task management',
      endpoints: {
        mcp: '/mcp',
        vibe: '/vibe/ws',
        webhooks: '/webhooks/fizzy',
        health: '/health',
        docs: 'https://fizzy.yogan.dev',
      },
      github: 'https://github.com/ryanyogan/fizzy-do-mcp',
    });
  });

  // Mount routes
  app.route('/api', apiRoutes);
  app.route('/mcp', mcpRoutes);
  app.route('/vibe', vibeRoutes);
  app.route('/webhooks', webhookRoutes);

  // 404 handler
  app.notFound((c) => {
    return c.json(
      {
        error: 'not_found',
        message: `Route not found: ${c.req.method} ${c.req.path}`,
      },
      404,
    );
  });

  // Error handler
  app.onError((err, c) => {
    console.error('Unhandled error:', err);

    const isDev = c.env.ENVIRONMENT === 'development';

    return c.json(
      {
        error: 'internal_server_error',
        message: isDev ? err.message : 'An unexpected error occurred',
        requestId: c.get('requestId'),
      },
      500,
    );
  });

  return app;
}
