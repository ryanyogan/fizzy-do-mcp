import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import {
  getConfigDir,
  getConfigPath,
  ensureConfigDir,
  readStoredConfig,
  saveConfig,
  resolveConfig,
  isConfigured,
  clearConfig,
} from './credentials.js';

// Mock the fs and os modules
vi.mock('node:fs');
vi.mock('node:os');

describe('credentials', () => {
  const mockHome = '/home/testuser';
  const mockConfigDir = '/home/testuser/.config/fizzy-mcp';
  const mockConfigPath = '/home/testuser/.config/fizzy-mcp/config.json';

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(os.homedir).mockReturnValue(mockHome);

    // Clear environment variables
    delete process.env.FIZZY_ACCESS_TOKEN;
    delete process.env.FIZZY_ACCOUNT_SLUG;
    delete process.env.FIZZY_BASE_URL;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getConfigDir', () => {
    it('returns the config directory path', () => {
      const dir = getConfigDir();
      expect(dir).toBe(mockConfigDir);
    });
  });

  describe('getConfigPath', () => {
    it('returns the config file path', () => {
      const configPath = getConfigPath();
      expect(configPath).toBe(mockConfigPath);
    });
  });

  describe('ensureConfigDir', () => {
    it('creates the directory if it does not exist', () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);

      ensureConfigDir();

      expect(fs.mkdirSync).toHaveBeenCalledWith(mockConfigDir, {
        recursive: true,
        mode: 0o700,
      });
    });

    it('does not create the directory if it exists', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);

      ensureConfigDir();

      expect(fs.mkdirSync).not.toHaveBeenCalled();
    });
  });

  describe('readStoredConfig', () => {
    it('returns empty object if config file does not exist', () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);

      const config = readStoredConfig();

      expect(config).toEqual({});
    });

    it('reads and parses the config file', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(
        JSON.stringify({
          accessToken: 'test-token',
          accountSlug: '/test-account',
        }),
      );

      const config = readStoredConfig();

      expect(config).toEqual({
        accessToken: 'test-token',
        accountSlug: '/test-account',
      });
    });

    it('returns empty object on parse error', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue('invalid json');

      // Spy on console.error to verify warning is logged
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      const config = readStoredConfig();

      expect(config).toEqual({});
      expect(consoleError).toHaveBeenCalled();
    });
  });

  describe('saveConfig', () => {
    it('creates the config directory and writes the file', () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);

      saveConfig({
        accessToken: 'test-token',
        accountSlug: '/test-account',
      });

      expect(fs.mkdirSync).toHaveBeenCalled();
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        mockConfigPath,
        expect.stringContaining('test-token'),
        { mode: 0o600 },
      );
    });

    it('writes with secure permissions (mode 600)', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);

      saveConfig({ accessToken: 'test-token' });

      expect(fs.writeFileSync).toHaveBeenCalledWith(
        mockConfigPath,
        expect.any(String),
        { mode: 0o600 },
      );
    });
  });

  describe('resolveConfig', () => {
    it('returns null if no access token is available', () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);

      const config = resolveConfig();

      expect(config).toBeNull();
    });

    it('resolves config from stored file', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(
        JSON.stringify({
          accessToken: 'stored-token',
          accountSlug: '/stored-account',
        }),
      );

      const config = resolveConfig();

      expect(config).toEqual({
        accessToken: 'stored-token',
        accountSlug: '/stored-account',
        baseUrl: 'https://app.fizzy.do',
      });
    });

    it('prefers environment variables over stored config', () => {
      process.env.FIZZY_ACCESS_TOKEN = 'env-token';
      process.env.FIZZY_ACCOUNT_SLUG = '/env-account';

      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(
        JSON.stringify({
          accessToken: 'stored-token',
          accountSlug: '/stored-account',
        }),
      );

      const config = resolveConfig();

      expect(config?.accessToken).toBe('env-token');
      expect(config?.accountSlug).toBe('/env-account');
    });

    it('uses custom base URL from environment', () => {
      process.env.FIZZY_ACCESS_TOKEN = 'test-token';
      process.env.FIZZY_BASE_URL = 'https://custom.fizzy.do';

      vi.mocked(fs.existsSync).mockReturnValue(false);

      const config = resolveConfig();

      expect(config?.baseUrl).toBe('https://custom.fizzy.do');
    });

    it('uses default base URL if not specified', () => {
      process.env.FIZZY_ACCESS_TOKEN = 'test-token';

      vi.mocked(fs.existsSync).mockReturnValue(false);

      const config = resolveConfig();

      expect(config?.baseUrl).toBe('https://app.fizzy.do');
    });
  });

  describe('isConfigured', () => {
    it('returns true if environment variable is set', () => {
      process.env.FIZZY_ACCESS_TOKEN = 'test-token';
      vi.mocked(fs.existsSync).mockReturnValue(false);

      expect(isConfigured()).toBe(true);
    });

    it('returns true if stored config has token', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(
        JSON.stringify({ accessToken: 'stored-token' }),
      );

      expect(isConfigured()).toBe(true);
    });

    it('returns false if no token is available', () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);

      expect(isConfigured()).toBe(false);
    });
  });

  describe('clearConfig', () => {
    it('deletes the config file if it exists', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);

      clearConfig();

      expect(fs.unlinkSync).toHaveBeenCalledWith(mockConfigPath);
    });

    it('does nothing if config file does not exist', () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);

      clearConfig();

      expect(fs.unlinkSync).not.toHaveBeenCalled();
    });
  });
});
