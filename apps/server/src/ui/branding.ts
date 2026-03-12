/**
 * Branding utilities for the Fizzy MCP CLI.
 *
 * Provides consistent styling with the Fizzy brand colors:
 * - Primary: Cyan (#22d3ee)
 * - Background: Dark teal (#0d181d)
 */

import chalk from 'chalk';
import figlet from 'figlet';
import boxen from 'boxen';

/**
 * Fizzy brand colors.
 */
export const colors = {
  primary: chalk.hex('#22d3ee'),
  primaryBright: chalk.hex('#67e8f9'),
  secondary: chalk.hex('#14b8a6'),
  accent: chalk.hex('#a78bfa'),
  success: chalk.hex('#4ade80'),
  warning: chalk.hex('#fbbf24'),
  error: chalk.hex('#f87171'),
  muted: chalk.hex('#64748b'),
  text: chalk.hex('#e2e8f0'),
} as const;

/**
 * ASCII art logo for Fizzy MCP.
 * Uses bubbles style for a playful, bubbly look.
 */
export function getLogo(): string {
  try {
    const logo = figlet.textSync('Fizzy', {
      font: 'Standard',
      horizontalLayout: 'default',
    });
    return colors.primary(logo);
  } catch {
    // Fallback if figlet fails
    return colors.primary(`
  _____ _               
 |  ___(_)_________   _ 
 | |_  | |_  /_  / | | |
 |  _| | |/ / / /| |_| |
 |_|   |_/___/___|\__, |
                  |___/ 
`);
  }
}

/**
 * Displays the Fizzy MCP banner with logo and tagline.
 */
export function showBanner(): void {
  const logo = getLogo();
  const tagline = colors.muted('AI-powered task management for the modern team');
  const version = colors.muted(`v${process.env.npm_package_version || '0.1.0'}`);

  console.error(logo);
  console.error(tagline);
  console.error(version);
  console.error('');
}

/**
 * Creates a styled box around content.
 */
export function box(
  content: string,
  options?: {
    title?: string;
    borderColor?: string;
    padding?: number;
  },
): string {
  return boxen(content, {
    padding: options?.padding ?? 1,
    margin: { top: 0, bottom: 1, left: 0, right: 0 },
    borderStyle: 'round',
    borderColor: options?.borderColor ?? '#22d3ee',
    title: options?.title,
    titleAlignment: 'left',
  });
}

/**
 * Formats a success message.
 */
export function success(message: string): string {
  return `${colors.success('✔')} ${message}`;
}

/**
 * Formats an error message.
 */
export function error(message: string): string {
  return `${colors.error('✖')} ${colors.error(message)}`;
}

/**
 * Formats a warning message.
 */
export function warning(message: string): string {
  return `${colors.warning('⚠')} ${colors.warning(message)}`;
}

/**
 * Formats an info message.
 */
export function info(message: string): string {
  return `${colors.primary('ℹ')} ${message}`;
}

/**
 * Creates a styled header.
 */
export function header(text: string): string {
  const line = colors.primary('─'.repeat(Math.min(text.length + 4, 60)));
  return `${line}\n${colors.primaryBright(text)}\n${line}`;
}

/**
 * Creates a styled list item.
 */
export function listItem(text: string, bullet = '•'): string {
  return `  ${colors.primary(bullet)} ${text}`;
}

/**
 * Creates a key-value pair display.
 */
export function keyValue(key: string, value: string): string {
  return `${colors.muted(key + ':')} ${colors.text(value)}`;
}

/**
 * Displays instructions for getting a Fizzy token.
 */
export function showTokenInstructions(): void {
  const instructions = [
    colors.text('To authenticate, you need a Personal Access Token from Fizzy.'),
    '',
    `${colors.primary('1.')} Go to ${colors.primaryBright('https://app.fizzy.do')}`,
    `${colors.primary('2.')} Click your avatar → ${colors.text('Profile')} → ${colors.text('API')}`,
    `${colors.primary('3.')} Create a new ${colors.primaryBright('Personal Access Token')}`,
  ].join('\n');

  console.error(box(instructions, { title: 'Authentication' }));
}

/**
 * Displays a welcome message for successful authentication.
 */
export function showWelcome(userName: string, accountName: string): void {
  const welcome = [
    success(`Welcome, ${colors.primaryBright(userName)}!`),
    '',
    keyValue('Account', accountName),
  ].join('\n');

  console.error(box(welcome, { title: 'Authenticated', borderColor: '#4ade80' }));
}

/**
 * Displays the MCP server configuration example.
 */
export function showMcpConfig(serverType: string, config: object): void {
  const json = JSON.stringify(config, null, 2);
  const formatted = json.replace(/"([^"]+)":/g, (_, key) => `${colors.primary(`"${key}"`)}:`);

  console.error('');
  console.error(colors.muted(`Add this to your ${serverType} configuration:`));
  console.error('');
  console.error(formatted);
}
