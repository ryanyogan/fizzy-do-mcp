/**
 * AI agent configuration detection and paths.
 *
 * Supports auto-configuration for:
 * - Claude Desktop
 * - Cursor
 * - OpenCode
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

/**
 * Supported AI agents that can be auto-configured.
 */
export type AgentType = 'claude-desktop' | 'cursor' | 'opencode';

/**
 * Information about an AI agent.
 */
export interface AgentInfo {
  type: AgentType;
  name: string;
  description: string;
  configPath: string;
  exists: boolean;
}

/**
 * MCP server configuration for Fizzy (Claude Desktop / Cursor format).
 */
export interface McpServerConfig {
  command: string;
  args: string[];
  env?: Record<string, string>;
}

/**
 * MCP server configuration for OpenCode format.
 */
export interface OpenCodeServerConfig {
  type: 'local';
  command: string[];
  env?: Record<string, string>;
}

/**
 * Gets the home directory cross-platform.
 */
function getHome(): string {
  return os.homedir();
}

/**
 * Gets the config path for Claude Desktop.
 */
function getClaudeDesktopConfigPath(): string {
  const platform = process.platform;
  const home = getHome();

  if (platform === 'darwin') {
    return path.join(home, 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json');
  } else if (platform === 'win32') {
    return path.join(process.env.APPDATA || path.join(home, 'AppData', 'Roaming'), 'Claude', 'claude_desktop_config.json');
  } else {
    // Linux
    return path.join(home, '.config', 'Claude', 'claude_desktop_config.json');
  }
}

/**
 * Gets the config path for Cursor.
 */
function getCursorConfigPath(): string {
  const home = getHome();
  return path.join(home, '.cursor', 'mcp.json');
}

/**
 * Gets the config path for OpenCode.
 */
function getOpenCodeConfigPath(): string {
  const home = getHome();
  return path.join(home, '.config', 'opencode', 'opencode.json');
}

/**
 * Detects which AI agents are available on the system.
 *
 * @returns Array of detected agents with their config paths and existence status
 */
export function detectAgents(): AgentInfo[] {
  const agents: AgentInfo[] = [
    {
      type: 'claude-desktop',
      name: 'Claude Desktop',
      description: 'Anthropic\'s official Claude desktop app',
      configPath: getClaudeDesktopConfigPath(),
      exists: false,
    },
    {
      type: 'cursor',
      name: 'Cursor',
      description: 'AI-powered code editor',
      configPath: getCursorConfigPath(),
      exists: false,
    },
    {
      type: 'opencode',
      name: 'OpenCode',
      description: 'Open-source AI coding assistant',
      configPath: getOpenCodeConfigPath(),
      exists: false,
    },
  ];

  // Check if config files or parent directories exist
  for (const agent of agents) {
    const configDir = path.dirname(agent.configPath);
    // Consider agent "exists" if the config file exists OR the parent directory exists
    // (meaning the app is likely installed but not yet configured)
    agent.exists = fs.existsSync(agent.configPath) || fs.existsSync(configDir);
  }

  return agents;
}

/**
 * Gets agents that are available for configuration.
 */
export function getAvailableAgents(): AgentInfo[] {
  return detectAgents().filter((agent) => agent.exists);
}

/**
 * Generates the Fizzy MCP server configuration for a specific agent.
 *
 * @param agentType - The type of agent to generate config for
 * @returns The MCP server configuration object
 */
export function generateServerConfig(agentType: AgentType): McpServerConfig | OpenCodeServerConfig {
  if (agentType === 'opencode') {
    // OpenCode uses command as an array, no separate args
    return {
      type: 'local',
      command: ['npx', '-y', 'fizzy-do-mcp@latest'],
    };
  }

  // Claude Desktop and Cursor use command + args format
  return {
    command: 'npx',
    args: ['-y', 'fizzy-do-mcp@latest'],
  };
}

/**
 * Reads an existing agent configuration file.
 *
 * @param configPath - Path to the config file
 * @returns The parsed configuration or null if not found/invalid
 */
export function readAgentConfig(configPath: string): Record<string, unknown> | null {
  try {
    if (!fs.existsSync(configPath)) {
      return null;
    }
    const content = fs.readFileSync(configPath, 'utf-8');
    return JSON.parse(content) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/**
 * Writes an agent configuration file.
 *
 * @param configPath - Path to the config file
 * @param config - The configuration to write
 */
export function writeAgentConfig(configPath: string, config: Record<string, unknown>): void {
  const dir = path.dirname(configPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

/**
 * Adds Fizzy MCP server to an agent's configuration.
 *
 * @param agent - The agent to configure
 * @returns true if configuration was added/updated, false if already present
 */
export function configureAgent(agent: AgentInfo): boolean {
  const existingConfig = readAgentConfig(agent.configPath) || {};
  const serverConfig = generateServerConfig(agent.type);

  let configKey: string;
  let serverKey: string;

  switch (agent.type) {
    case 'claude-desktop':
      configKey = 'mcpServers';
      serverKey = 'fizzy';
      break;
    case 'cursor':
      configKey = 'mcpServers';
      serverKey = 'fizzy';
      break;
    case 'opencode':
      configKey = 'mcp';
      serverKey = 'fizzy';
      // OpenCode uses a slightly different format
      break;
    default:
      return false;
  }

  // Get or create the servers section
  const servers = (existingConfig[configKey] as Record<string, unknown>) || {};

  // Check if already configured
  if (servers[serverKey]) {
    return false;
  }

  // Add Fizzy server config (format already correct from generateServerConfig)
  servers[serverKey] = serverConfig;

  existingConfig[configKey] = servers;
  writeAgentConfig(agent.configPath, existingConfig);

  return true;
}

/**
 * Checks if Fizzy is already configured in an agent.
 *
 * @param agent - The agent to check
 * @returns true if Fizzy is already configured
 */
export function isAgentConfigured(agent: AgentInfo): boolean {
  const config = readAgentConfig(agent.configPath);
  if (!config) return false;

  const configKey = agent.type === 'opencode' ? 'mcp' : 'mcpServers';
  const servers = config[configKey] as Record<string, unknown> | undefined;

  return servers?.['fizzy'] !== undefined;
}
