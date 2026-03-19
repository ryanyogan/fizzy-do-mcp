/**
 * GitHub operations for Vibe Mode.
 *
 * Uses the GitHub CLI (`gh`) to create pull requests and interact with GitHub.
 * Assumes `gh` is installed and authenticated.
 *
 * @module vibe/github
 */

import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

/**
 * Options for creating a pull request.
 */
export interface CreatePROptions {
  /** PR title */
  title: string;

  /** PR body (markdown) */
  body: string;

  /** Head branch (the feature branch) */
  head: string;

  /** Base branch (the target branch, usually main) */
  base: string;

  /** GitHub usernames to assign to the PR */
  assignees?: string[];

  /** Labels to apply to the PR */
  labels?: string[];

  /** Whether to create as draft PR */
  draft?: boolean;
}

/**
 * Result of PR creation.
 */
export interface PRResult {
  /** Whether the PR was created successfully */
  success: boolean;

  /** PR number */
  number?: number;

  /** PR URL */
  url?: string;

  /** Error message if creation failed */
  error?: string;
}

/**
 * Interface for GitHub operations.
 */
export interface GitHubOps {
  /** Creates a pull request */
  createPR(options: CreatePROptions): Promise<PRResult>;

  /** Gets the URL for a PR by number */
  getPRUrl(prNumber: number): string;

  /** Checks if gh CLI is available and authenticated */
  checkAuth(): Promise<boolean>;

  /** Gets the current repository info (owner/repo) */
  getRepoInfo(): Promise<{ owner: string; repo: string } | null>;
}

/**
 * Creates a GitHubOps instance for the specified repository path.
 *
 * @param repoPath - Path to the git repository
 * @returns GitHubOps instance
 *
 * @example
 * ```typescript
 * const github = createGitHubOps('/path/to/repo');
 *
 * const result = await github.createPR({
 *   title: 'Fix login bug',
 *   body: '## Summary\n\nFixes the login issue...',
 *   head: 'ai/card-123-fix-bug',
 *   base: 'main',
 * });
 *
 * if (result.success) {
 *   console.log('Created PR:', result.url);
 * }
 * ```
 */
export function createGitHubOps(repoPath: string): GitHubOps {
  const execOptions = { cwd: repoPath };

  return {
    async createPR(options: CreatePROptions): Promise<PRResult> {
      try {
        // Build the gh pr create command
        const args: string[] = ['pr', 'create', '--title', options.title, '--body', options.body];

        // Add base branch
        args.push('--base', options.base);

        // Add head branch
        args.push('--head', options.head);

        // Add assignees
        if (options.assignees && options.assignees.length > 0) {
          args.push('--assignee', options.assignees.join(','));
        }

        // Add labels
        if (options.labels && options.labels.length > 0) {
          args.push('--label', options.labels.join(','));
        }

        // Create as draft if specified
        if (options.draft) {
          args.push('--draft');
        }

        // Execute gh command
        const { stdout } = await execAsync(`gh ${args.map(escapeArg).join(' ')}`, execOptions);

        // gh pr create outputs the PR URL on success
        const url = stdout.trim();
        const prNumberMatch = url.match(/\/pull\/(\d+)$/);

        if (prNumberMatch?.[1]) {
          return {
            success: true,
            number: parseInt(prNumberMatch[1], 10),
            url,
          };
        }

        return {
          success: true,
          url,
        };
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? ((error as Error & { stderr?: string }).stderr ?? error.message)
            : String(error);

        return {
          success: false,
          error: errorMessage,
        };
      }
    },

    getPRUrl(prNumber: number): string {
      // This returns a placeholder - actual URL comes from createPR
      return `#${prNumber}`;
    },

    async checkAuth(): Promise<boolean> {
      try {
        await execAsync('gh auth status', execOptions);
        return true;
      } catch {
        return false;
      }
    },

    async getRepoInfo(): Promise<{ owner: string; repo: string } | null> {
      try {
        const { stdout } = await execAsync(
          'gh repo view --json owner,name --jq ".owner.login + \\"/\\" + .name"',
          execOptions,
        );

        const parts = stdout.trim().split('/');
        if (parts.length === 2) {
          return { owner: parts[0]!, repo: parts[1]! };
        }
        return null;
      } catch {
        return null;
      }
    },
  };
}

/**
 * Escapes a shell argument for safe execution.
 *
 * @param arg - Argument to escape
 * @returns Escaped argument
 */
function escapeArg(arg: string): string {
  // If the argument contains special characters, wrap in single quotes
  // and escape any single quotes within
  if (/["\s$`\\!]/.test(arg)) {
    return `'${arg.replace(/'/g, "'\\''")}'`;
  }
  return arg;
}
