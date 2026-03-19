/**
 * Branding utilities for the Fizzy Do CLI.
 *
 * Provides consistent styling with the Fizzy.do brand colors:
 * - Primary: Blue (oklch 57.02% 0.1895 260.46 → #3b82f6)
 * - Light mode accent: (oklch 50% 0.2 260 → #2563eb)
 * - Dark mode accent: (oklch 74% 0.1293 256 → #60a5fa)
 */

import chalk from 'chalk';
import figlet from 'figlet';
import boxen from 'boxen';
import gradient from 'gradient-string';

/**
 * Fizzy Do brand gradient - blue spectrum
 */
const fizzyGradient = gradient(['#3b82f6', '#60a5fa', '#93c5fd']);

/**
 * Fizzy Do brand colors.
 */
export const colors = {
  primary: chalk.hex('#3b82f6'),
  primaryBright: chalk.hex('#60a5fa'),
  secondary: chalk.hex('#2563eb'),
  accent: chalk.hex('#8b5cf6'),
  success: chalk.hex('#22c55e'),
  warning: chalk.hex('#f59e0b'),
  error: chalk.hex('#ef4444'),
  muted: chalk.hex('#6b7280'),
  text: chalk.hex('#f3f4f6'),
} as const;

/**
 * ASCII art logo for Fizzy Do with gradient coloring.
 */
export function getLogo(): string {
  try {
    const logo = figlet.textSync('Fizzy Do', {
      font: 'ANSI Shadow',
      horizontalLayout: 'default',
    });
    return fizzyGradient.multiline(logo);
  } catch {
    // Fallback with simpler font
    try {
      const logo = figlet.textSync('Fizzy Do', {
        font: 'Standard',
        horizontalLayout: 'default',
      });
      return fizzyGradient.multiline(logo);
    } catch {
      // Final fallback - manual ASCII art
      const fallback = `
 ███████╗██╗███████╗███████╗██╗   ██╗    ██████╗  ██████╗ 
 ██╔════╝██║╚══███╔╝╚══███╔╝╚██╗ ██╔╝    ██╔══██╗██╔═══██╗
 █████╗  ██║  ███╔╝   ███╔╝  ╚████╔╝     ██║  ██║██║   ██║
 ██╔══╝  ██║ ███╔╝   ███╔╝    ╚██╔╝      ██║  ██║██║   ██║
 ██║     ██║███████╗███████╗   ██║       ██████╔╝╚██████╔╝
 ╚═╝     ╚═╝╚══════╝╚══════╝   ╚═╝       ╚═════╝  ╚═════╝ 
`;
      return fizzyGradient.multiline(fallback);
    }
  }
}

/**
 * Compact ASCII logo for smaller displays.
 */
export function getCompactLogo(): string {
  const logo = `
╭─────────────────────────────────────╮
│  ⚡ Fizzy Do                        │
│  Your AI Works While You Sleep      │
╰─────────────────────────────────────╯`;
  return fizzyGradient.multiline(logo);
}

/**
 * Displays the Fizzy Do banner with gradient logo and tagline.
 */
export function showBanner(): void {
  console.error('');
  console.error(getLogo());
  console.error('');
  console.error(colors.muted('  Your AI works while you sleep'));
  console.error(colors.muted(`  v${process.env.npm_package_version || '0.2.0'}`));
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
    borderColor: options?.borderColor ?? '#3b82f6',
    ...(options?.title !== undefined && { title: options.title }),
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

  console.error(box(welcome, { title: 'Authenticated', borderColor: '#22c55e' }));
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
