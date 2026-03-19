/**
 * Work executor for Vibe Mode.
 *
 * Orchestrates the execution of AI work based on the mode (ai-plan or ai-code).
 * Dispatches to the appropriate mode handler and reports progress/completion.
 *
 * @module vibe/executor
 */

import type { FizzyClient } from '@fizzy-do-mcp/client';
import type { CardWorkItem, VibeConfig } from '@fizzy-do-mcp/shared';
import type { VibeClient } from './client.js';
import { executePlanMode } from './modes/plan.js';
import { startCodeMode, completeCodeMode, cleanupCodeMode } from './modes/code.js';

/**
 * Result of work execution.
 */
export interface ExecuteResult {
  /** Whether the work completed successfully */
  success: boolean;

  /** URL of the created PR (for ai-code mode) */
  prUrl?: string;

  /** Summary of what was accomplished */
  summary: string;

  /** Error message if failed */
  error?: string;
}

/**
 * Options for executing work.
 */
export interface ExecuteWorkOptions {
  /** The card to work on */
  card: CardWorkItem;

  /** The AI work mode */
  mode: 'ai-code' | 'ai-plan';

  /** Board configuration */
  config: VibeConfig;

  /** Vibe client for progress reporting */
  vibeClient: VibeClient;

  /** Fizzy client for API operations */
  fizzyClient: FizzyClient;

  /** Path to the git repository */
  repoPath: string;
}

/**
 * Executes AI work on a card.
 *
 * Dispatches to plan or code mode based on the work type.
 * Reports progress, handles errors, and notifies completion.
 *
 * @param options - Execution options
 * @returns Execution result
 *
 * @example
 * ```typescript
 * const result = await executeWork({
 *   card: workItem,
 *   mode: 'ai-code',
 *   config: vibeConfig,
 *   vibeClient,
 *   fizzyClient,
 *   repoPath: '/path/to/repo',
 * });
 *
 * if (result.success) {
 *   console.log('Work completed:', result.summary);
 *   if (result.prUrl) {
 *     console.log('PR:', result.prUrl);
 *   }
 * } else {
 *   console.error('Work failed:', result.error);
 * }
 * ```
 */
export async function executeWork(options: ExecuteWorkOptions): Promise<ExecuteResult> {
  const { card, mode, config, vibeClient, fizzyClient, repoPath } = options;

  try {
    if (mode === 'ai-plan') {
      return await executePlanWork(card, config, vibeClient, fizzyClient);
    } else {
      return await executeCodeWork(card, config, vibeClient, fizzyClient, repoPath);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const result: ExecuteResult = {
      success: false,
      summary: `Unexpected error: ${errorMessage}`,
      error: errorMessage,
    };

    // Report failure
    vibeClient.sendWorkFailed(card.number, errorMessage);

    return result;
  }
}

/**
 * Executes plan mode work.
 */
async function executePlanWork(
  card: CardWorkItem,
  config: VibeConfig,
  vibeClient: VibeClient,
  fizzyClient: FizzyClient,
): Promise<ExecuteResult> {
  const planResult = await executePlanMode({
    card,
    config,
    vibeClient,
    fizzyClient,
  });

  if (planResult.success) {
    vibeClient.sendWorkCompleted(card.number, planResult.summary);
    return {
      success: true,
      summary: planResult.summary,
    };
  } else {
    const errorMsg = planResult.error ?? 'Planning failed';
    vibeClient.sendWorkFailed(card.number, errorMsg);
    return {
      success: false,
      summary: planResult.summary,
      error: errorMsg,
    };
  }
}

/**
 * Executes code mode work.
 *
 * NOTE: In the current implementation, this only sets up the environment.
 * The actual coding work is done externally by Claude Code / AI.
 * Call completeCodeModeWork() after coding is done to create the PR.
 */
async function executeCodeWork(
  card: CardWorkItem,
  config: VibeConfig,
  vibeClient: VibeClient,
  fizzyClient: FizzyClient,
  repoPath: string,
): Promise<ExecuteResult> {
  // Start code mode - create branch and set up environment
  const startResult = await startCodeMode({
    card,
    config,
    repoPath,
    vibeClient,
    fizzyClient,
  });

  if (!startResult.success) {
    const errorMsg = startResult.error ?? 'Failed to start code mode';
    vibeClient.sendWorkFailed(card.number, errorMsg);
    return {
      success: false,
      summary: startResult.summary,
      error: errorMsg,
    };
  }

  // For now, this is a placeholder implementation.
  // In a real implementation, Claude Code / AI would do the actual coding here.
  // The work would then be completed by calling completeCodeModeWork().

  // Report that we're ready for coding
  vibeClient.sendWorkProgress(
    card.number,
    'ready',
    `Branch ${startResult.branch} created. Ready for coding.`,
  );

  // NOTE: This is where AI coding would happen in a full implementation.
  // For now, we mark as failed since actual coding isn't implemented yet.

  vibeClient.sendWorkFailed(
    card.number,
    'Code execution not yet implemented - branch created but no changes made',
    `Branch: ${startResult.branch}`,
  );

  // Clean up
  if (startResult.branch) {
    await cleanupCodeMode({ card, config, repoPath, vibeClient, fizzyClient }, startResult.branch);
  }

  return {
    success: false,
    summary: `Branch ${startResult.branch} created but coding not implemented`,
    error: 'Code execution not yet implemented',
  };
}

/**
 * Completes code mode work by committing and creating a PR.
 *
 * Call this after the AI has finished making code changes.
 *
 * @param options - Execution options
 * @param branchName - The feature branch name
 * @param commitMessage - Optional commit message
 * @returns Execution result with PR URL
 *
 * @example
 * ```typescript
 * // After AI coding is complete...
 * const result = await completeCodeModeWork(
 *   options,
 *   'ai/card-123-fix-bug',
 *   'fix: resolve login validation issue'
 * );
 *
 * if (result.success) {
 *   console.log('PR created:', result.prUrl);
 * }
 * ```
 */
export async function completeCodeModeWork(
  options: ExecuteWorkOptions,
  branchName: string,
  commitMessage?: string,
): Promise<ExecuteResult> {
  const { card, config, vibeClient, fizzyClient, repoPath } = options;

  try {
    const completeResult = await completeCodeMode(
      { card, config, repoPath, vibeClient, fizzyClient },
      branchName,
      commitMessage,
    );

    if (completeResult.success && completeResult.prUrl) {
      vibeClient.sendWorkCompleted(card.number, completeResult.summary, completeResult.prUrl);
      return {
        success: true,
        prUrl: completeResult.prUrl,
        summary: completeResult.summary,
      };
    } else {
      const errorMsg = completeResult.error ?? 'Failed to complete work';
      vibeClient.sendWorkFailed(card.number, errorMsg);
      return {
        success: false,
        summary: completeResult.summary,
        error: errorMsg,
      };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    vibeClient.sendWorkFailed(card.number, errorMessage);
    return {
      success: false,
      summary: `Failed to complete work: ${errorMessage}`,
      error: errorMessage,
    };
  }
}

/**
 * Cancels in-progress work and cleans up.
 *
 * @param options - Execution options
 * @param branchName - The feature branch to clean up
 */
export async function cancelWork(options: ExecuteWorkOptions, branchName?: string): Promise<void> {
  const { card, config, vibeClient, fizzyClient, repoPath } = options;

  if (branchName) {
    await cleanupCodeMode({ card, config, repoPath, vibeClient, fizzyClient }, branchName);
  }
}
