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
 * Configuration stored in the config file (~/.config/fizzy-mcp/config.json).
 */
export const StoredConfigSchema = z.object({
  accessToken: z.string().optional(),
  accountSlug: z.string().optional(),
  baseUrl: z.string().url().optional(),
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
  dir: '.config/fizzy-mcp',
  file: 'config.json',
} as const;
