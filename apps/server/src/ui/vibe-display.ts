/**
 * Terminal UI components for Vibe Mode.
 *
 * Provides branded display functions for the vibe coding experience.
 */

import gradient from 'gradient-string';
import { colors, box } from './branding.js';
import type { BoardWithConfig } from '../vibe/detector.js';
import type { VibeConfig } from '@fizzy-do-mcp/shared';

/**
 * Fizzy vibe gradient - energetic purple-blue spectrum
 */
const vibeGradient = gradient(['#8b5cf6', '#3b82f6', '#06b6d4']);

/**
 * Displays the Vibe Mode header banner.
 */
export function displayVibeHeader(): void {
  const banner = `
    ██╗   ██╗██╗██████╗ ███████╗
    ██║   ██║██║██╔══██╗██╔════╝
    ██║   ██║██║██████╔╝█████╗  
    ╚██╗ ██╔╝██║██╔══██╗██╔══╝  
     ╚████╔╝ ██║██████╔╝███████╗
      ╚═══╝  ╚═╝╚═════╝ ╚══════╝
`;

  console.error('');
  console.error(vibeGradient.multiline(banner));
  console.error(colors.primaryBright('  Fizzy Do Vibe Coding Mode'));
  console.error(colors.muted('  Your AI works while you sleep'));
  console.error('');
}

/**
 * Displays a compact vibe header for subsequent messages.
 */
export function displayVibeHeaderCompact(): void {
  console.error('');
  console.error(vibeGradient('Fizzy Do Vibe Mode'));
  console.error('');
}

/**
 * Displays a list of boards with their card counts.
 *
 * @param boards - Boards to display
 */
export function displayBoardList(boards: BoardWithConfig[]): void {
  if (boards.length === 0) {
    console.error(colors.warning('No boards configured for vibe coding.'));
    console.error(
      colors.muted('Create a card with #ai-config tag containing your repository configuration.'),
    );
    return;
  }

  const lines = boards.map((board, index) => {
    const readyBadge =
      board.readyCards > 0
        ? colors.success(` [${board.readyCards} ready]`)
        : colors.muted(' [0 ready]');

    return `${colors.primary(`${index + 1}.`)} ${colors.text(board.name)}${readyBadge}`;
  });

  console.error(box(lines.join('\n'), { title: 'Available Boards' }));
}

/**
 * Displays the waiting state for vibe mode.
 *
 * @param boardName - Name of the board being watched
 * @param config - Board configuration
 */
export function displayWaiting(boardName: string, config: VibeConfig): void {
  const content = [
    `${colors.primary('Board:')} ${colors.text(boardName)}`,
    `${colors.primary('Repository:')} ${colors.text(config.repository)}`,
    `${colors.primary('Branch:')} ${colors.text(config.default_branch)}`,
    '',
    colors.muted('Waiting for cards in the Accepted column...'),
    colors.muted('Cards need #ai-code or #ai-plan tags to be picked up.'),
    '',
    colors.muted('Press Ctrl+C to exit'),
  ].join('\n');

  console.error(box(content, { title: 'Vibe Mode Active', borderColor: '#8b5cf6' }));
}

/**
 * Displays session status information.
 *
 * @param boardName - Board being worked on
 * @param repoPath - Local repository path
 * @param cardsCompleted - Number of cards completed this session
 */
export function displaySessionStatus(
  boardName: string,
  repoPath: string,
  cardsCompleted: number,
): void {
  const status = cardsCompleted > 0 ? colors.success(`${cardsCompleted} completed`) : 'Starting...';

  const content = [
    `${colors.primary('Board:')} ${colors.text(boardName)}`,
    `${colors.primary('Repo:')} ${colors.muted(repoPath)}`,
    `${colors.primary('Cards:')} ${status}`,
  ].join('\n');

  console.error(box(content, { title: 'Session', borderColor: '#3b82f6' }));
}

/**
 * Displays a message about column setup.
 *
 * @param created - Names of columns that were created
 * @param existing - Names of columns that already existed
 */
export function displayColumnSetup(created: string[], existing: string[]): void {
  const lines: string[] = [];

  if (existing.length > 0) {
    lines.push(`${colors.muted('Existing:')} ${existing.join(', ')}`);
  }

  if (created.length > 0) {
    lines.push(`${colors.success('Created:')} ${created.join(', ')}`);
  }

  if (lines.length > 0) {
    console.error(box(lines.join('\n'), { title: 'Workflow Columns' }));
  }
}

/**
 * Displays an error message in vibe mode style.
 *
 * @param message - Error message
 * @param hint - Optional hint for resolution
 */
export function displayVibeError(message: string, hint?: string): void {
  const content = [colors.error(message), hint ? '' : null, hint ? colors.muted(hint) : null]
    .filter(Boolean)
    .join('\n');

  console.error(box(content, { title: 'Error', borderColor: '#ef4444' }));
}

/**
 * Displays a success message in vibe mode style.
 *
 * @param message - Success message
 */
export function displayVibeSuccess(message: string): void {
  console.error(colors.success(`  ${message}`));
}

/**
 * Displays repository detection information.
 *
 * @param repoPath - Path to the repository
 * @param repoUrl - Repository URL (if detected)
 * @param branch - Current branch
 * @param isClean - Whether working directory is clean
 */
export function displayRepoInfo(
  repoPath: string,
  repoUrl: string | null,
  branch: string,
  isClean: boolean,
): void {
  const cleanStatus = isClean ? colors.success('clean') : colors.warning('uncommitted changes');

  const lines = [
    `${colors.primary('Path:')} ${colors.muted(repoPath)}`,
    repoUrl ? `${colors.primary('Remote:')} ${colors.text(repoUrl)}` : null,
    `${colors.primary('Branch:')} ${colors.text(branch)} (${cleanStatus})`,
  ]
    .filter(Boolean)
    .join('\n');

  console.error(box(lines, { title: 'Repository' }));
}
