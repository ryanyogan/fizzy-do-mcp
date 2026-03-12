/**
 * @fizzy-mcp/server
 *
 * MCP server for integrating AI agents with Fizzy (Basecamp's task management tool).
 *
 * This server exposes Fizzy operations as MCP tools that AI agents can invoke
 * to list, create, update, and manage cards, boards, comments, and more.
 *
 * @example
 * ```bash
 * # Configure with access token
 * fizzy-mcp auth
 *
 * # Run the server
 * fizzy-mcp
 * ```
 *
 * @packageDocumentation
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { FizzyClient } from '@fizzy-mcp/client';
import { registerAllTools } from '@fizzy-mcp/tools';
import { resolveConfig, isConfigured } from './credentials.js';

const VERSION = '0.1.0';

/**
 * Creates and configures the MCP server.
 */
async function createServer(): Promise<McpServer> {
  // Check if configured
  if (!isConfigured()) {
    console.error('Error: Fizzy MCP server is not configured.');
    console.error('');
    console.error('Run "fizzy-mcp auth" to configure your access token.');
    console.error('');
    console.error('Or set the FIZZY_ACCESS_TOKEN environment variable.');
    process.exit(1);
  }

  // Resolve configuration
  const config = resolveConfig();
  if (!config) {
    console.error('Error: Invalid configuration.');
    console.error('');
    console.error('Run "fizzy-mcp auth" to reconfigure.');
    process.exit(1);
  }

  // Create server
  const server = new McpServer({
    name: 'fizzy-mcp',
    version: VERSION,
  });

  // Determine account slug - may need to auto-detect
  let accountSlug = config.accountSlug;

  if (!accountSlug) {
    // Create a temporary client to fetch identity
    const tempClient = new FizzyClient({
      accessToken: config.accessToken,
      baseUrl: config.baseUrl,
    });

    console.error('Auto-detecting account...');
    const identityResult = await tempClient.identity.getIdentity();

    if (!identityResult.ok) {
      console.error('Error: Could not fetch identity:', identityResult.error.message);
      console.error('');
      console.error('Please check your access token and try again.');
      process.exit(1);
    }

    const accounts = identityResult.value.accounts;
    if (accounts.length === 0) {
      console.error('Error: No accessible accounts found.');
      console.error('');
      console.error('Make sure your access token has access to at least one Fizzy account.');
      process.exit(1);
    }

    // Use the first account
    const account = accounts[0]!;
    accountSlug = account.slug.startsWith('/') ? account.slug : `/${account.slug}`;
    console.error(`Using account: ${account.name} (${accountSlug})`);
  }

  // Create client with the resolved account slug
  const client = new FizzyClient({
    accessToken: config.accessToken,
    accountSlug,
    baseUrl: config.baseUrl,
  });

  // Register all tools
  registerAllTools(server, client);

  return server;
}

/**
 * Main entry point - starts the MCP server.
 */
async function main(): Promise<void> {
  try {
    const server = await createServer();
    const transport = new StdioServerTransport();

    console.error('Starting Fizzy MCP server...');
    await server.connect(transport);
    console.error('Fizzy MCP server connected.');
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

// Run when executed directly
main();

// Export for programmatic use
export { createServer };
