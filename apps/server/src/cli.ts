/**
 * CLI for the Fizzy MCP server.
 *
 * Commands:
 * - configure: Set up Fizzy token and auto-configure AI agents
 * - whoami: Show current identity
 * - status: Check server configuration
 * - logout: Clear stored credentials
 */

import { Command } from 'commander';
import * as readline from 'node:readline';
import { readFileSync } from 'node:fs';
import { exec } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { FizzyClient } from '@fizzy-do-mcp/client';
import { FIZZY_TOKEN_URL } from '@fizzy-do-mcp/shared';
import {
  resolveConfig,
  saveConfig,
  clearConfig,
  isConfigured,
  getConfigPath,
  readStoredConfig,
} from './credentials.js';
import { showBanner, showWelcome, colors, box, keyValue, listItem } from './ui/index.js';
import { withSpinner, showSuccess, showFailure, showInfo, showWarning } from './ui/spinner.js';
import { runConfigureFlow } from './configure/index.js';

// Read version from package.json
const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf-8')) as {
  version: string;
};
const VERSION = pkg.version;

const program = new Command();

program
  .name('fizzy-do-mcp')
  .alias('fdm')
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
 * Opens a URL in the default browser.
 */
function openBrowser(url: string): void {
  const command =
    process.platform === 'darwin'
      ? `open "${url}"`
      : process.platform === 'win32'
        ? `start "" "${url}"`
        : `xdg-open "${url}"`;

  exec(command, (err) => {
    if (err) {
      console.error(colors.muted(`Could not open browser. Please visit: ${url}`));
    }
  });
}

/**
 * Prompts for Fizzy access token with option to open browser.
 */
async function promptFizzyToken(): Promise<string> {
  const tokenInstructions = [
    colors.text('You need a Personal Access Token from Fizzy.'),
    '',
    `${colors.primary('1.')} Go to ${colors.primaryBright(FIZZY_TOKEN_URL)}`,
    `${colors.primary('2.')} Click ${colors.text('New Personal Access Token')}`,
    `${colors.primary('3.')} Give it a name and copy the token`,
    '',
    colors.muted('Press Enter to open the page in your browser, or paste your token:'),
  ].join('\n');

  console.error(box(tokenInstructions, { title: 'Fizzy Token' }));

  const input = await prompt(`${colors.primary('Token:')} `, true);

  if (!input || input.trim() === '') {
    // Open browser to Fizzy token page
    console.error('');
    showInfo(`Opening ${FIZZY_TOKEN_URL} in your browser...`);
    openBrowser(FIZZY_TOKEN_URL);
    console.error('');
    console.error(colors.muted('After creating your token, paste it here:'));

    const token = await prompt(`${colors.primary('Token:')} `, true);
    return token.trim();
  }

  return input.trim();
}

/**
 * Configure command - set up Fizzy token and configure AI agents
 */
program
  .command('configure')
  .description('Set up Fizzy token and auto-configure AI agents')
  .option('-t, --token <token>', 'Access token (will prompt if not provided)')
  .option('--no-agents', 'Skip auto-configuration of AI agents')
  .action(async (options: { token?: string; agents: boolean }) => {
    // Show beautiful banner
    showBanner();

    // Get Fizzy token
    let token = options.token;

    if (!token) {
      // Check if we already have a token
      const stored = readStoredConfig();
      if (stored.accessToken) {
        showInfo('Using existing Fizzy token');
        token = stored.accessToken;
      } else {
        token = await promptFizzyToken();
      }
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
    } catch {
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
      console.error(
        colors.muted('(Press Enter to auto-detect at runtime, or enter the account slug)'),
      );
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
    saveConfig({
      accessToken: token,
      accountSlug,
    });

    console.error('');
    showSuccess(`Configuration saved to ${getConfigPath()}`);

    // Run auto-configuration flow if not disabled
    if (options.agents) {
      await runConfigureFlow();
    }

    // Show manual configuration example
    console.error('');
    console.error(colors.text('MCP client configuration:'));
    console.error('');
    console.error(
      colors.muted(
        JSON.stringify(
          {
            mcpServers: {
              fizzy: {
                command: 'npx',
                args: ['-y', 'fizzy-do-mcp@latest'],
              },
            },
          },
          null,
          2,
        ),
      ),
    );
    console.error('');
    console.error(
      colors.muted('Credentials are stored securely - no need to add them to the config.'),
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
      showFailure('Not authenticated');
      console.error(colors.muted('Run "fizzy-do-mcp configure" first.'));
      process.exit(1);
    }

    const config = resolveConfig();
    if (!config) {
      showFailure('Invalid configuration');
      console.error(colors.muted('Run "fizzy-do-mcp configure" to reconfigure.'));
      process.exit(1);
    }

    const client = new FizzyClient({
      accessToken: config.accessToken,
      ...(config.accountSlug ? { accountSlug: config.accountSlug } : {}),
      baseUrl: config.baseUrl,
    });

    let identity;
    try {
      identity = await withSpinner('Fetching identity...', async () => {
        const result = await client.identity.getIdentity();
        if (!result.ok) {
          throw new Error(result.error.message);
        }
        return result.value;
      });
    } catch {
      showFailure('Failed to fetch identity');
      process.exit(1);
    }

    const firstAccount = identity.accounts[0];

    if (firstAccount) {
      const info = [
        keyValue('Name', firstAccount.user.name),
        keyValue('Email', firstAccount.user.email_address),
        firstAccount.user.avatar_url ? keyValue('Avatar', firstAccount.user.avatar_url) : null,
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
        colors.muted('Run "fizzy-do-mcp configure" to set up authentication.'),
      ].join('\n');

      console.error(box(status, { title: 'Server Status', borderColor: '#fbbf24' }));
      process.exit(0);
    }

    const config = resolveConfig();

    if (!config) {
      const status = [
        keyValue('Status', colors.error('Invalid configuration')),
        '',
        colors.muted('Run "fizzy-do-mcp configure" to reconfigure.'),
      ].join('\n');

      console.error(box(status, { title: 'Server Status', borderColor: '#f87171' }));
      process.exit(1);
    }

    const tokenMasked = '*'.repeat(8) + '...' + config.accessToken.slice(-4);

    const statusLines = [
      keyValue('Status', colors.success('Configured')),
      keyValue('Config file', getConfigPath()),
      keyValue('Base URL', config.baseUrl),
      keyValue('Account', config.accountSlug || colors.muted('(auto-detect)')),
      keyValue('Token', tokenMasked),
    ];

    console.error(
      box(statusLines.join('\n'), {
        title: 'Server Status',
        borderColor: '#4ade80',
      }),
    );
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
