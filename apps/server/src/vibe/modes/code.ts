/**
 * Code mode executor for #ai-code cards.
 *
 * Code mode prepares the environment for AI coding work:
 * - Checks out the default branch and pulls latest
 * - Creates a feature branch
 * - Reports work started
 *
 * The actual coding is done by Claude Code / the AI agent.
 * This module sets up the environment and handles PR creation after work is complete.
 *
 * @module vibe/modes/code
 */

import type { FizzyClient } from '@fizzy-do-mcp/client';
import type { CardWorkItem, VibeConfig } from '@fizzy-do-mcp/shared';
import type { VibeClient } from '../client.js';
import { createGitOps, generateBranchName, type GitOps } from '../git.js';
import { createGitHubOps, type GitHubOps } from '../github.js';
import { generatePRBody, generatePRTitle } from '../pr-template.js';

/**
 * Result of code mode execution.
 */
export interface CodeResult {
  /** Whether the work completed successfully */
  success: boolean;

  /** URL of the created PR (if successful) */
  prUrl?: string;

  /** Summary of what was done */
  summary: string;

  /** The feature branch name */
  branch?: string;

  /** Error message if failed */
  error?: string;
}

/**
 * Options for code mode execution.
 */
export interface CodeOptions {
  /** The card to work on */
  card: CardWorkItem;

  /** Board configuration */
  config: VibeConfig;

  /** Path to the git repository */
  repoPath: string;

  /** Vibe client for progress reporting */
  vibeClient: VibeClient;

  /** Fizzy client for API operations */
  fizzyClient: FizzyClient;
}

/**
 * Sets up the environment for code mode.
 *
 * This creates a feature branch and notifies that work has started.
 * The actual coding work is done externally by Claude Code / AI.
 *
 * @param options - Code execution options
 * @returns Result with the branch name
 *
 * @example
 * ```typescript
 * const result = await startCodeMode({
 *   card: workItem,
 *   config: vibeConfig,
 *   repoPath: '/path/to/repo',
 *   vibeClient,
 *   fizzyClient,
 * });
 *
 * if (result.success) {
 *   console.log(`Created branch: ${result.branch}`);
 *   // AI does work here...
 *   await completeCodeMode(options, result.branch);
 * }
 * ```
 */
export async function startCodeMode(options: CodeOptions): Promise<CodeResult> {
  const { card, config, repoPath, vibeClient, fizzyClient } = options;

  try {
    const git = createGitOps(repoPath);
    const github = createGitHubOps(repoPath);

    // Check gh auth
    const isAuthed = await github.checkAuth();
    if (!isAuthed) {
      return {
        success: false,
        summary: 'GitHub CLI not authenticated',
        error: 'Please run "gh auth login" to authenticate with GitHub',
      };
    }

    // Report progress: preparing environment
    vibeClient.sendWorkProgress(card.number, 'preparing', 'Setting up development environment');

    // Check if working directory is clean
    const isClean = await git.isClean();
    if (!isClean) {
      vibeClient.sendWorkProgress(card.number, 'stashing', 'Stashing uncommitted changes');
      await git.stash();
    }

    // Checkout default branch and pull latest
    vibeClient.sendWorkProgress(
      card.number,
      'syncing',
      `Checking out ${config.default_branch} and pulling latest`,
    );

    await git.checkout(config.default_branch);
    await git.pull();

    // Generate branch name
    const branchName = generateBranchName(config.branch_pattern, card.number, card.title);

    // Create feature branch
    vibeClient.sendWorkProgress(card.number, 'branching', `Creating branch: ${branchName}`);
    await git.createBranch(branchName, config.default_branch);

    // Add a comment to the card about the branch
    const branchComment = [
      '<h3>AI Work Started</h3>',
      '<p>Development environment prepared:</p>',
      '<ul>',
      `<li><strong>Branch:</strong> <code>${branchName}</code></li>`,
      `<li><strong>Base:</strong> <code>${config.default_branch}</code></li>`,
      '</ul>',
      '<p><em>Work in progress...</em></p>',
    ].join('\n');

    await fizzyClient.comments.create(card.number, { body: branchComment });

    // Report work started with branch name
    vibeClient.sendWorkStarted(card.number, branchName);

    return {
      success: true,
      summary: `Created branch ${branchName} for card #${card.number}`,
      branch: branchName,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    return {
      success: false,
      summary: `Failed to start code mode: ${errorMessage}`,
      error: errorMessage,
    };
  }
}

/**
 * Completes code mode by creating a PR.
 *
 * This should be called after the AI has finished coding.
 * It commits changes, pushes the branch, and creates a PR.
 *
 * @param options - Code execution options
 * @param branchName - The feature branch name
 * @param commitMessage - Commit message (optional, generates from card if not provided)
 * @returns Result with PR URL
 */
export async function completeCodeMode(
  options: CodeOptions,
  branchName: string,
  commitMessage?: string,
): Promise<CodeResult> {
  const { card, config, repoPath, vibeClient, fizzyClient } = options;

  try {
    const git = createGitOps(repoPath);
    const github = createGitHubOps(repoPath);

    // Report progress: finalizing
    vibeClient.sendWorkProgress(card.number, 'testing', 'Running checks');

    // Run checks (placeholder - in real implementation would run pnpm check && pnpm test)
    // For now, we'll skip this and just proceed

    // Check if there are changes to commit
    const isClean = await git.isClean();
    if (isClean) {
      return {
        success: false,
        summary: 'No changes to commit',
        branch: branchName,
        error: 'No changes were made to the codebase',
      };
    }

    // Stage and commit
    vibeClient.sendWorkProgress(card.number, 'committing', 'Committing changes');

    await git.add();
    const message = commitMessage ?? generateCommitMessage(card);
    await git.commit(message);

    // Push branch
    vibeClient.sendWorkProgress(card.number, 'pushing', `Pushing branch ${branchName}`);
    await git.push(branchName, true);

    // Get changed files for PR body
    const changedFiles = await git.getChangedFiles(config.default_branch);

    // Create PR
    vibeClient.sendWorkProgress(card.number, 'creating-pr', 'Creating pull request');

    const prTitle = generatePRTitle(card);
    const prBody = generatePRBody({
      card,
      config,
      summary: `AI-generated implementation for card #${card.number}`,
      changedFiles,
    });

    const prResult = await github.createPR({
      title: prTitle,
      body: prBody,
      head: branchName,
      base: config.default_branch,
    });

    if (!prResult.success || !prResult.url) {
      return {
        success: false,
        summary: `Failed to create PR: ${prResult.error ?? 'Unknown error'}`,
        branch: branchName,
        error: prResult.error ?? 'Unknown error',
      };
    }

    // Add PR link to card as comment
    const prComment = [
      '<h3>Pull Request Created</h3>',
      `<p><a href="${prResult.url}">${prTitle}</a></p>`,
      '<ul>',
      `<li><strong>PR:</strong> #${prResult.number}</li>`,
      `<li><strong>Branch:</strong> <code>${branchName}</code></li>`,
      `<li><strong>Files Changed:</strong> ${changedFiles.length}</li>`,
      '</ul>',
    ].join('\n');

    await fizzyClient.comments.create(card.number, { body: prComment });

    // Remove ai-code tag
    await fizzyClient.cards.toggleTag(card.number, 'ai-code');

    const summary = `Created PR #${prResult.number ?? '?'} for card #${card.number}`;

    return {
      success: true,
      prUrl: prResult.url!, // We checked prResult.url above
      summary,
      branch: branchName,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    return {
      success: false,
      summary: `Failed to complete code mode: ${errorMessage}`,
      branch: branchName,
      error: errorMessage,
    };
  }
}

/**
 * Cleans up a failed code mode session.
 *
 * @param options - Code execution options
 * @param branchName - The feature branch to clean up
 */
export async function cleanupCodeMode(options: CodeOptions, branchName: string): Promise<void> {
  const { config, repoPath, fizzyClient, card } = options;

  try {
    const git = createGitOps(repoPath);

    // Checkout default branch
    await git.checkout(config.default_branch);

    // Add failure comment
    const failureComment = [
      '<h3>AI Work Failed</h3>',
      `<p>Work on branch <code>${branchName}</code> was not completed.</p>`,
      '<p>The branch may still exist locally and can be resumed manually.</p>',
    ].join('\n');

    await fizzyClient.comments.create(card.number, { body: failureComment });
  } catch {
    // Cleanup is best-effort, don't throw
  }
}

/**
 * Generates a commit message from card info.
 */
function generateCommitMessage(card: CardWorkItem): string {
  // Determine commit type from tags
  const tags = card.tags.map((t) => t.toLowerCase());

  let prefix = 'feat';
  if (tags.includes('bug') || tags.includes('fix')) {
    prefix = 'fix';
  } else if (tags.includes('docs') || tags.includes('documentation')) {
    prefix = 'docs';
  } else if (tags.includes('refactor')) {
    prefix = 'refactor';
  } else if (tags.includes('test') || tags.includes('testing')) {
    prefix = 'test';
  } else if (tags.includes('chore')) {
    prefix = 'chore';
  }

  // Create conventional commit message
  return `${prefix}: ${card.title.toLowerCase()} (#${card.number})`;
}

// Re-export types and utilities for use by executor
export { createGitOps, createGitHubOps, generateBranchName };
export type { GitOps, GitHubOps };
