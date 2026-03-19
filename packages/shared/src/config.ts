import { z } from 'zod';

/**
 * Configuration schema for the Fizzy MCP server.
 */
export const FizzyConfigSchema = z.object({
  /**
   * Personal access token for authenticating with the Fizzy API.
   * Generate one at: https://app.fizzy.do → Profile → API → Personal Access Tokens
   */
  accessToken: z.string().min(1, 'Access token is required'),

  /**
   * Fizzy account slug (e.g., "/897362094").
   * Found in any Fizzy URL after logging in.
   * If not provided, it will be auto-detected from your first account.
   */
  accountSlug: z.string().optional(),

  /**
   * Base URL for the Fizzy API.
   * Defaults to "https://app.fizzy.do".
   */
  baseUrl: z.string().url().optional().default('https://app.fizzy.do'),
});

export type FizzyConfig = z.infer<typeof FizzyConfigSchema>;

/**
 * Configuration stored in the config file (~/.config/fizzy-do-mcp/config.json).
 */
export const StoredConfigSchema = z.object({
  /**
   * Fizzy personal access token.
   */
  accessToken: z.string().optional(),

  /**
   * Fizzy account slug.
   */
  accountSlug: z.string().optional(),

  /**
   * Fizzy API base URL.
   */
  baseUrl: z.string().url().optional(),

  /**
   * Whether webhook secret has been configured for this account.
   * Cached locally to avoid checking the server on every vibe start.
   */
  webhookConfigured: z.boolean().optional(),

  /**
   * ISO timestamp when webhook was configured.
   */
  webhookConfiguredAt: z.string().optional(),
});

export type StoredConfig = z.infer<typeof StoredConfigSchema>;

/**
 * Default configuration values.
 */
export const DEFAULT_CONFIG = {
  baseUrl: 'https://app.fizzy.do',
} as const;

/**
 * Environment variable names for configuration.
 */
export const ENV_VARS = {
  accessToken: 'FIZZY_ACCESS_TOKEN',
  accountSlug: 'FIZZY_ACCOUNT_SLUG',
  baseUrl: 'FIZZY_BASE_URL',
} as const;

/**
 * Configuration file paths.
 */
export const CONFIG_PATHS = {
  dir: '.config/fizzy-do-mcp',
  file: 'config.json',
} as const;

/**
 * Old configuration file paths (for migration from fizzy-mcp to fizzy-do-mcp).
 */
export const OLD_CONFIG_PATHS = {
  dir: '.config/fizzy-mcp',
  file: 'config.json',
} as const;

/**
 * URLs for the hosted MCP service.
 */
export const HOSTED_URLS = {
  base: 'https://mcp.fizzy.yogan.dev',
  mcp: 'https://mcp.fizzy.yogan.dev/mcp',
  webhookSecret: 'https://mcp.fizzy.yogan.dev/accounts/webhook-secret',
  webhooks: 'https://mcp.fizzy.yogan.dev/webhooks/fizzy',
} as const;

/**
 * URL for Fizzy API token generation page.
 */
export const FIZZY_TOKEN_URL = 'https://app.fizzy.do/my/profile/api';
