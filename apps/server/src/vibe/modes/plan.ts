/**
 * Plan mode executor for #ai-plan cards.
 *
 * Plan mode analyzes a card and breaks it down into implementation steps.
 * It does NOT make any git changes - it only updates the Fizzy card with:
 * - Implementation steps (checklist items)
 * - Planning notes as a comment
 *
 * @module vibe/modes/plan
 */

import type { FizzyClient } from '@fizzy-do-mcp/client';
import type { CardWorkItem, VibeConfig } from '@fizzy-do-mcp/shared';
import type { VibeClient } from '../client.js';

/**
 * Result of plan mode execution.
 */
export interface PlanResult {
  /** Whether planning completed successfully */
  success: boolean;

  /** Summary of what was planned */
  summary: string;

  /** Number of steps added */
  stepsAdded: number;

  /** Error message if failed */
  error?: string;
}

/**
 * Options for plan mode execution.
 */
export interface PlanOptions {
  /** The card to plan */
  card: CardWorkItem;

  /** Board configuration */
  config: VibeConfig;

  /** Vibe client for progress reporting */
  vibeClient: VibeClient;

  /** Fizzy client for API operations */
  fizzyClient: FizzyClient;
}

/**
 * Executes plan mode for a card.
 *
 * This analyzes the card title and description to break down the work
 * into implementation steps. Steps are added to the card as checklist items.
 *
 * @param options - Plan execution options
 * @returns Result of planning
 *
 * @example
 * ```typescript
 * const result = await executePlanMode({
 *   card: workItem,
 *   config: vibeConfig,
 *   vibeClient,
 *   fizzyClient,
 * });
 *
 * if (result.success) {
 *   console.log(`Added ${result.stepsAdded} implementation steps`);
 * }
 * ```
 */
export async function executePlanMode(options: PlanOptions): Promise<PlanResult> {
  const { card, vibeClient, fizzyClient } = options;

  try {
    // Report progress: analyzing
    vibeClient.sendWorkProgress(card.number, 'analyzing', 'Analyzing card requirements');

    // Generate implementation steps from card content
    const steps = generateImplementationSteps(card);

    // Report progress: adding steps
    vibeClient.sendWorkProgress(
      card.number,
      'planning',
      `Adding ${steps.length} implementation steps`,
    );

    // Add steps to the card
    let stepsAdded = 0;
    for (const stepContent of steps) {
      const result = await fizzyClient.steps.create(card.number, {
        content: stepContent,
        completed: false,
      });

      if (result.ok) {
        stepsAdded++;
      }
    }

    // Report progress: adding notes
    vibeClient.sendWorkProgress(card.number, 'documenting', 'Adding implementation notes');

    // Add planning notes as a comment
    const notesComment = generatePlanningNotes(card, steps);
    const commentResult = await fizzyClient.comments.create(card.number, {
      body: notesComment,
    });

    if (!commentResult.ok) {
      // Non-fatal - log but continue
      console.error('Failed to add planning notes comment:', commentResult.error.message);
    }

    // Remove the #ai-plan tag and add #planned
    vibeClient.sendWorkProgress(card.number, 'completing', 'Updating card status');

    // Toggle off ai-plan
    await fizzyClient.cards.toggleTag(card.number, 'ai-plan');

    // Close the card (planning is complete)
    const closeResult = await fizzyClient.cards.close(card.number);
    if (!closeResult.ok) {
      console.error('Failed to close card:', closeResult.error.message);
    }

    const summary = `Added ${stepsAdded} implementation steps to card #${card.number}`;

    return {
      success: true,
      summary,
      stepsAdded,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    return {
      success: false,
      summary: `Planning failed: ${errorMessage}`,
      stepsAdded: 0,
      error: errorMessage,
    };
  }
}

/**
 * Generates implementation steps from card content.
 *
 * This is a placeholder implementation that creates basic steps.
 * In a full implementation, this would use AI to analyze the requirements
 * and generate meaningful implementation steps.
 *
 * @param card - The card to analyze
 * @returns Array of step descriptions
 */
function generateImplementationSteps(card: CardWorkItem): string[] {
  const steps: string[] = [];

  // Basic steps for any task
  steps.push('Review requirements and acceptance criteria');

  // Add steps based on card title analysis
  const titleLower = card.title.toLowerCase();

  if (
    titleLower.includes('feature') ||
    titleLower.includes('add') ||
    titleLower.includes('implement')
  ) {
    steps.push('Design component/module architecture');
    steps.push('Implement core functionality');
    steps.push('Add error handling');
    steps.push('Write unit tests');
    steps.push('Add documentation');
  } else if (titleLower.includes('fix') || titleLower.includes('bug')) {
    steps.push('Reproduce the issue');
    steps.push('Identify root cause');
    steps.push('Implement fix');
    steps.push('Add regression test');
    steps.push('Verify fix in development');
  } else if (titleLower.includes('refactor') || titleLower.includes('improve')) {
    steps.push('Identify code to refactor');
    steps.push('Write tests for existing behavior');
    steps.push('Refactor code');
    steps.push('Verify tests still pass');
    steps.push('Update documentation if needed');
  } else if (titleLower.includes('test') || titleLower.includes('testing')) {
    steps.push('Identify test scenarios');
    steps.push('Set up test environment');
    steps.push('Write test cases');
    steps.push('Run tests and fix failures');
    steps.push('Document test coverage');
  } else {
    // Generic steps
    steps.push('Analyze existing codebase');
    steps.push('Implement changes');
    steps.push('Test changes locally');
    steps.push('Update documentation');
  }

  // Final steps
  steps.push('Create pull request');
  steps.push('Address code review feedback');

  return steps;
}

/**
 * Generates planning notes as an HTML comment.
 *
 * @param card - The card being planned
 * @param steps - The generated steps
 * @returns HTML-formatted comment body
 */
function generatePlanningNotes(card: CardWorkItem, steps: string[]): string {
  const lines = [
    '<h3>AI Planning Notes</h3>',
    '<p>This card has been analyzed and broken down into implementation steps.</p>',
    '<h4>Summary</h4>',
    '<ul>',
    `<li><strong>Card:</strong> #${card.number}</li>`,
    `<li><strong>Steps Added:</strong> ${steps.length}</li>`,
    `<li><strong>Board:</strong> ${card.board_name}</li>`,
    '</ul>',
  ];

  // Add guidance based on tags
  if (card.tags.some((t) => t.toLowerCase() === 'ai-code')) {
    lines.push(
      '<p><em>Note: This card also has #ai-code. After planning is complete, ' +
        'create a new card with #ai-code to implement.</em></p>',
    );
  }

  lines.push('<hr/>', '<p><small>Generated by Fizzy Do AI</small></p>');

  return lines.join('\n');
}
