/**
 * Git repository detection and board matching for Vibe Mode.
 *
 * Detects the current git repository and matches it to Fizzy boards
 * based on the repository URL in their #ai-config cards.
 */

import { simpleGit, type SimpleGit } from 'simple-git';
import type { VibeConfig } from '@fizzy-do-mcp/shared';

/**
 * Result of git repository detection.
 */
export interface GitRepoInfo {
  /** Repository root path */
  path: string;
  /** Normalized GitHub repository URL (https://github.com/owner/repo) */
  repoUrl: string | null;
  /** Current branch name */
  currentBranch: string;
  /** Whether the working directory is clean */
  isClean: boolean;
  /** Number of uncommitted changes */
  uncommittedChanges: number;
}

/**
 * Normalizes various git remote URL formats to a canonical https URL.
 *
 * Handles:
 * - SSH: git@github.com:owner/repo.git
 * - HTTPS: https://github.com/owner/repo.git
 * - HTTP: http://github.com/owner/repo
 */
function normalizeRepoUrl(remoteUrl: string): string | null {
  // SSH format: git@github.com:owner/repo.git
  const sshMatch = remoteUrl.match(/git@github\.com:([^/]+)\/([^/]+?)(?:\.git)?$/);
  if (sshMatch) {
    return `https://github.com/${sshMatch[1]}/${sshMatch[2]}`;
  }

  // HTTPS/HTTP format: https://github.com/owner/repo.git
  const httpsMatch = remoteUrl.match(/https?:\/\/github\.com\/([^/]+)\/([^/]+?)(?:\.git)?$/);
  if (httpsMatch) {
    return `https://github.com/${httpsMatch[1]}/${httpsMatch[2]}`;
  }

  // Already normalized
  if (remoteUrl.match(/^https:\/\/github\.com\/[^/]+\/[^/]+$/)) {
    return remoteUrl;
  }

  return null;
}

/**
 * Detects git repository information from the current working directory.
 *
 * @param cwd - Working directory to check (defaults to process.cwd())
 * @returns Repository info or null if not a git repository
 */
export async function detectGitRepo(cwd?: string): Promise<GitRepoInfo | null> {
  const git: SimpleGit = simpleGit(cwd || process.cwd());

  try {
    // Check if this is a git repository
    const isRepo = await git.checkIsRepo();
    if (!isRepo) {
      return null;
    }

    // Get repository root
    const rootPath = await git.revparse(['--show-toplevel']);

    // Get current branch
    const branch = await git.revparse(['--abbrev-ref', 'HEAD']);

    // Get remote URL (prefer origin)
    let repoUrl: string | null = null;
    try {
      const remotes = await git.getRemotes(true);
      const origin = remotes.find((r) => r.name === 'origin');
      if (origin?.refs?.fetch) {
        repoUrl = normalizeRepoUrl(origin.refs.fetch);
      } else if (remotes.length > 0 && remotes[0]?.refs?.fetch) {
        // Fall back to first remote
        repoUrl = normalizeRepoUrl(remotes[0].refs.fetch);
      }
    } catch {
      // No remotes configured
    }

    // Get working directory status
    const status = await git.status();

    return {
      path: rootPath.trim(),
      repoUrl,
      currentBranch: branch.trim(),
      isClean: status.isClean(),
      uncommittedChanges: status.files.length,
    };
  } catch {
    return null;
  }
}

/**
 * Board with parsed vibe config for matching.
 */
export interface BoardWithConfig {
  id: string;
  name: string;
  config: VibeConfig;
  cardNumber: number;
  readyCards: number;
}

/**
 * Checks if a board's config matches the current repository.
 *
 * @param boardConfig - Vibe config from the board's #ai-config card
 * @param repoUrl - Normalized repository URL to match against
 * @returns true if the config's repository matches
 */
export function matchBoardToRepo(boardConfig: VibeConfig, repoUrl: string): boolean {
  // Normalize both URLs for comparison
  const configUrl = normalizeRepoUrl(boardConfig.repository);
  const targetUrl = normalizeRepoUrl(repoUrl);

  if (!configUrl || !targetUrl) {
    return false;
  }

  return configUrl.toLowerCase() === targetUrl.toLowerCase();
}

/**
 * Finds boards that match the current repository.
 *
 * @param boards - List of boards with their parsed configs
 * @param repoUrl - Repository URL to match
 * @returns Boards whose config matches the repository
 */
export function findMatchingBoards(boards: BoardWithConfig[], repoUrl: string): BoardWithConfig[] {
  return boards.filter((board) => matchBoardToRepo(board.config, repoUrl));
}
