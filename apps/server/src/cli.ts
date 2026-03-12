/**
 * CLI for the Fizzy MCP server.
 *
 * Commands:
 * - auth: Configure authentication
 * - configure: Auto-configure AI agents
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
import {
  showBanner,
  showTokenInstructions,
  showWelcome,
  colors,
  box,
  keyValue,
  listItem,
} from './ui/index.js';
import { withSpinner, showSuccess, showFailure, showInfo, showWarning } from './ui/spinner.js';
import { runConfigureFlow } from './configure/index.js';

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
    output: process.stderr,
  });

  return new Promise((resolve) => {
    if (hidden) {
      // For hidden input, we need to manually handle it
      process.stderr.write(question);
      let input = '';

      process.stdin.setRawMode(true);
      process.stdin.resume();
      process.stdin.setEncoding('utf8');

      const onData = (char: string) => {
        if (char === '\n' || char === '\r' || char === '\u0004') {
          process.stdin.setRawMode(false);
          process.stdin.pause();
          process.stdin.removeListener('data', onData);
          process.stderr.write('\n');
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
  .option('--no-configure', 'Skip auto-configuration of AI agents')
  .action(async (options: { token?: string; configure: boolean }) => {
    // Show beautiful banner
    showBanner();

    // Show token instructions
    showTokenInstructions();

    let token = options.token;

    if (!token) {
      token = await prompt(`${colors.primary('Enter your access token:')} `, true);
    }

    if (!token || token.trim() === '') {
      showFailure('Access token is required');
      process.exit(1);
    }

    token = token.trim();

    // Validate the token by fetching identity
    let identity;
    try {
      identity = await withSpinner(
        'Validating token...',
        async () => {
          const client = new FizzyClient({ accessToken: token! });
          const result = await client.identity.getIdentity();
          if (!result.ok) {
            throw new Error(result.error.message);
          }
          return result.value;
        },
        {
          success: 'Token validated',
          failure: 'Invalid access token',
        },
      );
    } catch (err) {
      process.exit(1);
    }

    // Get user info from first account (user is the same across all accounts)
    const firstAccount = identity.accounts[0];
    if (firstAccount) {
      showWelcome(firstAccount.user.name, firstAccount.user.email_address);
    }

    // Show available accounts
    if (identity.accounts.length === 0) {
      showWarning('No accessible accounts found');
      console.error(colors.muted('Make sure your token has access to at least one account.'));
    } else if (identity.accounts.length > 1) {
      console.error('');
      console.error(colors.text('Available accounts:'));
      for (const account of identity.accounts) {
        const slug = account.slug.startsWith('/') ? account.slug : `/${account.slug}`;
        console.error(listItem(`${account.name} ${colors.muted(`(${slug})`)}`));
      }
    }

    // Determine account slug
    let accountSlug: string | undefined;

    if (identity.accounts.length === 1) {
      // Auto-select single account
      const account = identity.accounts[0]!;
      accountSlug = account.slug.startsWith('/') ? account.slug : `/${account.slug}`;
      showInfo(`Auto-selected account: ${account.name}`);
    } else if (identity.accounts.length > 1) {
      // Prompt for account selection
      console.error('');
      console.error(colors.text('Which account would you like to use?'));
      console.error(colors.muted('(Press Enter to auto-detect at runtime, or enter the account slug)'));
      const input = await prompt(`${colors.primary('Account slug:')} `);
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

    console.error('');
    showSuccess(`Configuration saved to ${getConfigPath()}`);

    // Run auto-configuration flow if not disabled
    if (options.configure) {
      await runConfigureFlow();
    }

    // Show manual configuration example
    console.error('');
    console.error(colors.text('Manual MCP configuration:'));
    console.error('');
    console.error(
      colors.muted(
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
      ),
    );
  });

/**
 * Configure command - auto-configure AI agents
 */
program
  .command('configure')
  .description('Auto-configure AI agents (Claude Desktop, Cursor, OpenCode)')
  .action(async () => {
    showBanner();

    if (!isConfigured()) {
      showFailure('Not authenticated');
      console.error(colors.muted('Run "fizzy-mcp auth" first to set up credentials.'));
      process.exit(1);
    }

    const configured = await runConfigureFlow();
    if (!configured) {
      console.error('');
      console.error(colors.muted('No agents were configured.'));
    }
  });

/**
 * Whoami command - show current identity
 */
program
  .command('whoami')
  .description('Show current Fizzy identity')
  .action(async () => {
    if (!isConfigured()) {
      showFailure('Not authenticated');
      console.error(colors.muted('Run "fizzy-mcp auth" first.'));
      process.exit(1);
    }

    const config = resolveConfig();
    if (!config) {
      showFailure('Invalid configuration');
      console.error(colors.muted('Run "fizzy-mcp auth" to reconfigure.'));
      process.exit(1);
    }

    const client = new FizzyClient({
      accessToken: config.accessToken,
      ...(config.accountSlug ? { accountSlug: config.accountSlug } : {}),
      baseUrl: config.baseUrl,
    });

    let identity;
    try {
      identity = await withSpinner(
        'Fetching identity...',
        async () => {
          const result = await client.identity.getIdentity();
          if (!result.ok) {
            throw new Error(result.error.message);
          }
          return result.value;
        },
      );
    } catch (err) {
      showFailure('Failed to fetch identity');
      process.exit(1);
    }

    const firstAccount = identity.accounts[0];

    if (firstAccount) {
      const info = [
        keyValue('Name', firstAccount.user.name),
        keyValue('Email', firstAccount.user.email_address),
        firstAccount.user.avatar_url
          ? keyValue('Avatar', firstAccount.user.avatar_url)
          : null,
      ]
        .filter(Boolean)
        .join('\n');

      console.error(box(info, { title: 'Identity' }));
    }

    console.error(colors.text('Accounts:'));
    for (const account of identity.accounts) {
      const slug = account.slug.startsWith('/') ? account.slug : `/${account.slug}`;
      const active = config.accountSlug === slug ? colors.success(' (active)') : '';
      console.error(listItem(`${account.name} ${colors.muted(`(${slug})`)}${active}`));
    }
  });

/**
 * Status command - check configuration
 */
program
  .command('status')
  .description('Check server configuration status')
  .action(() => {
    showBanner();

    if (!isConfigured()) {
      const status = [
        keyValue('Status', colors.warning('Not configured')),
        '',
        colors.muted('Run "fizzy-mcp auth" to configure authentication.'),
      ].join('\n');

      console.error(box(status, { title: 'Server Status', borderColor: '#fbbf24' }));
      process.exit(0);
    }

    const config = resolveConfig();
    if (!config) {
      const status = [
        keyValue('Status', colors.error('Invalid configuration')),
        '',
        colors.muted('Run "fizzy-mcp auth" to reconfigure.'),
      ].join('\n');

      console.error(box(status, { title: 'Server Status', borderColor: '#f87171' }));
      process.exit(1);
    }

    const tokenMasked = '*'.repeat(8) + '...' + config.accessToken.slice(-4);
    const status = [
      keyValue('Status', colors.success('Configured')),
      keyValue('Config file', getConfigPath()),
      keyValue('Base URL', config.baseUrl),
      keyValue('Account', config.accountSlug || colors.muted('(auto-detect)')),
      keyValue('Token', tokenMasked),
    ].join('\n');

    console.error(box(status, { title: 'Server Status', borderColor: '#4ade80' }));
  });

/**
 * Logout command - clear credentials
 */
program
  .command('logout')
  .description('Clear stored credentials')
  .action(() => {
    clearConfig();
    showSuccess('Credentials cleared');
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
