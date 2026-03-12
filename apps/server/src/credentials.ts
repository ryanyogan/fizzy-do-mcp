import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import {
  type FizzyConfig,
  type StoredConfig,
  FizzyConfigSchema,
  StoredConfigSchema,
  DEFAULT_CONFIG,
  ENV_VARS,
  CONFIG_PATHS,
} from '@fizzy-mcp/shared';

/**
 * Gets the full path to the config directory.
 */
export function getConfigDir(): string {
  return path.join(os.homedir(), CONFIG_PATHS.dir);
}

/**
 * Gets the full path to the config file.
 */
export function getConfigPath(): string {
  return path.join(getConfigDir(), CONFIG_PATHS.file);
}

/**
 * Ensures the config directory exists with proper permissions.
 */
export function ensureConfigDir(): void {
  const dir = getConfigDir();
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  }
}

/**
 * Reads the stored config from the config file.
 * Returns empty object if file doesn't exist.
 */
export function readStoredConfig(): StoredConfig {
  const configPath = getConfigPath();

  if (!fs.existsSync(configPath)) {
    return {};
  }

  try {
    const content = fs.readFileSync(configPath, 'utf-8');
    const data = JSON.parse(content);
    return StoredConfigSchema.parse(data);
  } catch (error) {
    // Return empty config on parse errors - will prompt for re-auth
    console.error(`Warning: Could not read config file: ${error}`);
    return {};
  }
}

/**
 * Saves config to the config file with secure permissions (mode 600).
 */
export function saveConfig(config: StoredConfig): void {
  ensureConfigDir();
  const configPath = getConfigPath();

  // Write with mode 600 (owner read/write only)
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), {
    mode: 0o600,
  });
}

/**
 * Resolves the full configuration from environment variables and config file.
 * Environment variables take precedence over the config file.
 *
 * @returns The resolved configuration, or null if access token is missing
 */
export function resolveConfig(): FizzyConfig | null {
  const stored = readStoredConfig();

  const accessToken = process.env[ENV_VARS.accessToken] || stored.accessToken;
  const accountSlug = process.env[ENV_VARS.accountSlug] || stored.accountSlug;
  const baseUrl = process.env[ENV_VARS.baseUrl] || stored.baseUrl || DEFAULT_CONFIG.baseUrl;

  if (!accessToken) {
    return null;
  }

  const result = FizzyConfigSchema.safeParse({
    accessToken,
    accountSlug,
    baseUrl,
  });

  if (!result.success) {
    console.error('Invalid configuration:', result.error.format());
    return null;
  }

  return result.data;
}

/**
 * Checks if the server is configured (has an access token).
 */
export function isConfigured(): boolean {
  const accessToken = process.env[ENV_VARS.accessToken] || readStoredConfig().accessToken;
  return Boolean(accessToken);
}

/**
 * Clears the stored configuration.
 */
export function clearConfig(): void {
  const configPath = getConfigPath();
  if (fs.existsSync(configPath)) {
    fs.unlinkSync(configPath);
  }
}
