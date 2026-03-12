/**
 * CLI for the Fizzy MCP server.
 *
 * Commands:
 * - auth: Configure authentication
 * - whoami: Show current identity
 * - status: Check server configuration
 * - logout: Clear stored credentials
 */

import { Command } from 'commander';
import * as readline from 'node:readline';
import { FizzyClient } from '@fizzy-mcp/client';
import {
  resolveConfig,
  saveConfig,
  clearConfig,
  isConfigured,
  getConfigPath,
  readStoredConfig,
} from './credentials.js';

const VERSION = '0.1.0';

const program = new Command();

program
  .name('fizzy-mcp')
  .description('MCP server for Fizzy - AI-powered task management')
  .version(VERSION);

/**
 * Prompts for user input from stdin.
 */
async function prompt(question: string, hidden = false): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    if (hidden) {
      // For hidden input, we need to manually handle it
      process.stdout.write(question);
      let input = '';

      process.stdin.setRawMode(true);
      process.stdin.resume();
      process.stdin.setEncoding('utf8');

      const onData = (char: string) => {
        if (char === '\n' || char === '\r' || char === '\u0004') {
          process.stdin.setRawMode(false);
          process.stdin.pause();
          process.stdin.removeListener('data', onData);
          process.stdout.write('\n');
          rl.close();
          resolve(input);
        } else if (char === '\u0003') {
          // Ctrl+C
          process.exit(0);
        } else if (char === '\u007F' || char === '\b') {
          // Backspace
          if (input.length > 0) {
            input = input.slice(0, -1);
          }
        } else {
          input += char;
        }
      };

      process.stdin.on('data', onData);
    } else {
      rl.question(question, (answer) => {
        rl.close();
        resolve(answer);
      });
    }
  });
}

/**
 * Auth command - configure access token
 */
program
  .command('auth')
  .description('Configure Fizzy authentication')
  .option('-t, --token <token>', 'Access token (will prompt if not provided)')
  .action(async (options: { token?: string }) => {
    console.log('Fizzy MCP Authentication');
    console.log('========================');
    console.log('');
    console.log('To authenticate, you need a Personal Access Token from Fizzy.');
    console.log('');
    console.log('1. Go to https://app.fizzy.do');
    console.log('2. Click your avatar → Profile → API');
    console.log('3. Create a new Personal Access Token');
    console.log('');

    let token = options.token;

    if (!token) {
      token = await prompt('Enter your access token: ', true);
    }

    if (!token || token.trim() === '') {
      console.error('Error: Access token is required.');
      process.exit(1);
    }

    token = token.trim();

    // Validate the token by fetching identity
    console.log('');
    console.log('Validating token...');

    const client = new FizzyClient({
      accessToken: token,
    });

    const result = await client.identity.getIdentity();

    if (!result.ok) {
      console.error('Error: Invalid access token.');
      console.error(`Details: ${result.error.message}`);
      process.exit(1);
    }

    const identity = result.value;

    // Get user info from first account (user is the same across all accounts)
    const firstAccount = identity.accounts[0];
    if (firstAccount) {
      console.log(`Authenticated as: ${firstAccount.user.name} (${firstAccount.user.email_address})`);
      console.log('');
    }

    // Show available accounts
    if (identity.accounts.length === 0) {
      console.error('Warning: No accessible accounts found.');
      console.error('Make sure your token has access to at least one account.');
    } else {
      console.log('Available accounts:');
      for (const account of identity.accounts) {
        const slug = account.slug.startsWith('/') ? account.slug : `/${account.slug}`;
        console.log(`  - ${account.name} (${slug})`);
      }
      console.log('');
    }

    // Determine account slug
    let accountSlug: string | undefined;

    if (identity.accounts.length === 1) {
      // Auto-select single account
      const account = identity.accounts[0]!;
      accountSlug = account.slug.startsWith('/') ? account.slug : `/${account.slug}`;
      console.log(`Auto-selected account: ${account.name}`);
    } else if (identity.accounts.length > 1) {
      // Prompt for account selection
      console.log('Which account would you like to use?');
      console.log('(Press Enter to auto-detect at runtime, or enter the account slug)');
      const input = await prompt('Account slug: ');
      if (input.trim()) {
        accountSlug = input.trim();
        // Ensure it starts with /
        if (!accountSlug.startsWith('/')) {
          accountSlug = '/' + accountSlug;
        }
      }
    }

    // Save configuration
    const stored = readStoredConfig();
    saveConfig({
      ...stored,
      accessToken: token,
      accountSlug,
    });

    console.log('');
    console.log(`Configuration saved to: ${getConfigPath()}`);
    console.log('');
    console.log('You can now use the Fizzy MCP server with Claude or other MCP clients.');
    console.log('');
    console.log('Example Claude Desktop configuration:');
    console.log(
      JSON.stringify(
        {
          mcpServers: {
            fizzy: {
              command: 'npx',
              args: ['@fizzy-mcp/server'],
            },
          },
        },
        null,
        2,
      ),
    );
  });

/**
 * Whoami command - show current identity
 */
program
  .command('whoami')
  .description('Show current Fizzy identity')
  .action(async () => {
    if (!isConfigured()) {
      console.error('Not authenticated. Run "fizzy-mcp auth" first.');
      process.exit(1);
    }

    const config = resolveConfig();
    if (!config) {
      console.error('Invalid configuration. Run "fizzy-mcp auth" to reconfigure.');
      process.exit(1);
    }

    const client = new FizzyClient({
      accessToken: config.accessToken,
      ...(config.accountSlug ? { accountSlug: config.accountSlug } : {}),
      baseUrl: config.baseUrl,
    });

    const result = await client.identity.getIdentity();

    if (!result.ok) {
      console.error('Error fetching identity:', result.error.message);
      process.exit(1);
    }

    const identity = result.value;
    const firstAccount = identity.accounts[0];

    if (firstAccount) {
      console.log(`Name: ${firstAccount.user.name}`);
      console.log(`Email: ${firstAccount.user.email_address}`);
      console.log(`Avatar: ${firstAccount.user.avatar_url || '(none)'}`);
      console.log('');
    }

    console.log('Accounts:');
    for (const account of identity.accounts) {
      const slug = account.slug.startsWith('/') ? account.slug : `/${account.slug}`;
      const active = config.accountSlug === slug ? ' (active)' : '';
      console.log(`  - ${account.name} (${slug})${active}`);
    }
  });

/**
 * Status command - check configuration
 */
program
  .command('status')
  .description('Check server configuration status')
  .action(() => {
    console.log('Fizzy MCP Server Status');
    console.log('=======================');
    console.log('');

    if (!isConfigured()) {
      console.log('Status: Not configured');
      console.log('');
      console.log('Run "fizzy-mcp auth" to configure authentication.');
      process.exit(0);
    }

    const config = resolveConfig();
    if (!config) {
      console.log('Status: Invalid configuration');
      console.log('');
      console.log('Run "fizzy-mcp auth" to reconfigure.');
      process.exit(1);
    }

    console.log('Status: Configured');
    console.log('');
    console.log(`Config file: ${getConfigPath()}`);
    console.log(`Base URL: ${config.baseUrl}`);
    console.log(`Account: ${config.accountSlug || '(auto-detect)'}`);
    console.log(`Token: ${'*'.repeat(8)}...${config.accessToken.slice(-4)}`);
  });

/**
 * Logout command - clear credentials
 */
program
  .command('logout')
  .description('Clear stored credentials')
  .action(() => {
    clearConfig();
    console.log('Credentials cleared.');
  });

/**
 * Default command (no subcommand) - run the server
 */
program.action(async () => {
  // Import and run the server
  await import('./index.js');
});

// Parse and execute
program.parse();
