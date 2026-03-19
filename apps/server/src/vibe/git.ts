/**
 * Git operations for Vibe Mode.
 *
 * Provides a thin wrapper around simple-git for common git operations
 * needed during AI work execution: branching, committing, pushing.
 *
 * @module vibe/git
 */

import { simpleGit, type SimpleGit } from 'simple-git';

/**
 * Interface for git operations needed by the executor.
 */
export interface GitOps {
  /** Gets the current branch name */
  getCurrentBranch(): Promise<string>;

  /** Checks out a branch (must already exist) */
  checkout(branch: string): Promise<void>;

  /** Pulls the latest changes from remote */
  pull(): Promise<void>;

  /** Creates a new branch from the specified base (or current branch) */
  createBranch(name: string, from?: string): Promise<void>;

  /** Stages files (undefined = all files) */
  add(files?: string[]): Promise<void>;

  /** Creates a commit with the given message */
  commit(message: string): Promise<void>;

  /** Pushes a branch to remote */
  push(branch: string, setUpstream?: boolean): Promise<void>;

  /** Gets the diff between the current branch and a base branch */
  getDiff(base: string): Promise<string>;

  /** Gets the list of changed files compared to a base branch */
  getChangedFiles(base: string): Promise<string[]>;

  /** Stashes current changes */
  stash(): Promise<void>;

  /** Restores stashed changes */
  stashPop(): Promise<void>;

  /** Checks if the working directory is clean */
  isClean(): Promise<boolean>;

  /** Gets the default remote name (usually 'origin') */
  getDefaultRemote(): Promise<string>;

  /** Fetches from remote */
  fetch(): Promise<void>;
}

/**
 * Creates a GitOps instance for the specified repository path.
 *
 * @param repoPath - Path to the git repository
 * @returns GitOps instance
 *
 * @example
 * ```typescript
 * const git = createGitOps('/path/to/repo');
 *
 * // Create a feature branch
 * await git.checkout('main');
 * await git.pull();
 * await git.createBranch('ai/card-123-fix-bug', 'main');
 *
 * // ... make changes ...
 *
 * await git.add();
 * await git.commit('fix: resolve login issue (#123)');
 * await git.push('ai/card-123-fix-bug', true);
 * ```
 */
export function createGitOps(repoPath: string): GitOps {
  const git: SimpleGit = simpleGit(repoPath);

  return {
    async getCurrentBranch(): Promise<string> {
      const branch = await git.revparse(['--abbrev-ref', 'HEAD']);
      return branch.trim();
    },

    async checkout(branch: string): Promise<void> {
      await git.checkout(branch);
    },

    async pull(): Promise<void> {
      await git.pull();
    },

    async createBranch(name: string, from?: string): Promise<void> {
      if (from) {
        await git.checkoutBranch(name, from);
      } else {
        await git.checkoutLocalBranch(name);
      }
    },

    async add(files?: string[]): Promise<void> {
      if (files && files.length > 0) {
        await git.add(files);
      } else {
        await git.add('.');
      }
    },

    async commit(message: string): Promise<void> {
      await git.commit(message);
    },

    async push(branch: string, setUpstream?: boolean): Promise<void> {
      if (setUpstream) {
        await git.push(['--set-upstream', 'origin', branch]);
      } else {
        await git.push('origin', branch);
      }
    },

    async getDiff(base: string): Promise<string> {
      const diff = await git.diff([`${base}...HEAD`]);
      return diff;
    },

    async getChangedFiles(base: string): Promise<string[]> {
      const diff = await git.diff(['--name-only', `${base}...HEAD`]);
      return diff
        .trim()
        .split('\n')
        .filter((line) => line.length > 0);
    },

    async stash(): Promise<void> {
      await git.stash(['push', '-m', 'vibe-mode-stash']);
    },

    async stashPop(): Promise<void> {
      await git.stash(['pop']);
    },

    async isClean(): Promise<boolean> {
      const status = await git.status();
      return status.isClean();
    },

    async getDefaultRemote(): Promise<string> {
      const remotes = await git.getRemotes();
      const origin = remotes.find((r) => r.name === 'origin');
      return origin?.name ?? remotes[0]?.name ?? 'origin';
    },

    async fetch(): Promise<void> {
      await git.fetch();
    },
  };
}

/**
 * Generates a branch name from a card number and title.
 *
 * @param pattern - Branch pattern (e.g., 'ai/card-{number}-{slug}')
 * @param cardNumber - Card number
 * @param title - Card title
 * @returns Generated branch name
 *
 * @example
 * ```typescript
 * const branch = generateBranchName(
 *   'ai/card-{number}-{slug}',
 *   123,
 *   'Fix login bug'
 * );
 * // Returns: 'ai/card-123-fix-login-bug'
 * ```
 */
export function generateBranchName(pattern: string, cardNumber: number, title: string): string {
  // Create slug from title
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with dashes
    .replace(/^-+|-+$/g, '') // Remove leading/trailing dashes
    .slice(0, 50); // Limit length

  return pattern.replace('{number}', String(cardNumber)).replace('{slug}', slug);
}
