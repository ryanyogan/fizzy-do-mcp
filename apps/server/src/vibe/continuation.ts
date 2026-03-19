/**
 * Board Continuation Logic for Vibe Mode.
 *
 * When AI finishes work on a card, this module helps identify the next
 * eligible card on the same board. The server (Cloudflare Worker) manages
 * the work queue, but the client uses this to provide status feedback.
 *
 * @module vibe/continuation
 */

import type { FizzyClient } from '@fizzy-do-mcp/client';

/**
 * Represents a card that is ready for AI work.
 */
export interface CardForWork {
  /** Card number (visible in Fizzy URL) */
  number: number;

  /** Card title */
  title: string;

  /** Card description (may be null) */
  description: string | null;

  /** Tags applied to the card */
  tags: string[];

  /** AI work mode determined by tags */
  mode: 'ai-code' | 'ai-plan';
}

/**
 * Result of scanning for the next card.
 */
export interface ScanResult {
  /** Whether cards were found */
  found: boolean;

  /** The next card to work on (if found) */
  card: CardForWork | null;

  /** Number of additional cards waiting */
  queueLength: number;
}

/** Column names that indicate a card is ready for work */
const ACCEPTED_COLUMN_NAMES = ['accepted', 'to do', 'todo', 'ready'];

/**
 * Determines the AI work mode from a card's tags.
 *
 * @param tags - Array of tag strings
 * @returns The AI mode or null if no AI tag is present
 */
function getAiMode(tags: string[]): 'ai-code' | 'ai-plan' | null {
  const normalizedTags = tags.map((t) => t.toLowerCase());

  if (normalizedTags.includes('ai-code')) {
    return 'ai-code';
  }
  if (normalizedTags.includes('ai-plan')) {
    return 'ai-plan';
  }
  return null;
}

/**
 * Checks if a column name matches an "Accepted" column.
 *
 * @param columnName - The column name to check
 * @returns True if the column is considered an "Accepted" column
 */
function isAcceptedColumn(columnName: string | undefined): boolean {
  if (!columnName) return false;
  const normalized = columnName.toLowerCase().trim();
  return ACCEPTED_COLUMN_NAMES.includes(normalized);
}

/**
 * Finds the next card ready for AI work on a board.
 *
 * Queries cards on the board filtered by:
 * - Has #ai-code or #ai-plan tag
 * - In "Accepted" column (or equivalent - To Do, Ready, etc.)
 * - NOT the current/completed card
 * - Returns the oldest eligible card (FIFO)
 *
 * @param fizzyClient - The Fizzy API client
 * @param boardId - The board ID to scan
 * @param excludeCardNumber - Optional card number to exclude (just completed)
 * @returns The next card for work or null if none available
 *
 * @example
 * ```typescript
 * const nextCard = await findNextCard(client, 'board-123', 42);
 * if (nextCard) {
 *   console.log(`Next card: #${nextCard.number} - ${nextCard.title}`);
 * }
 * ```
 */
export async function findNextCard(
  fizzyClient: FizzyClient,
  boardId: string,
  excludeCardNumber?: number,
): Promise<CardForWork | null> {
  // Get cards from the board, sorted by oldest first (FIFO)
  const cardsResult = await fizzyClient.cards.list({
    board_ids: [boardId],
    sorted_by: 'oldest',
  });

  if (!cardsResult.ok) {
    return null;
  }

  // Filter for AI-tagged cards
  const aiCards = cardsResult.value.filter((card) => {
    // Exclude the just-completed card
    if (excludeCardNumber !== undefined && card.number === excludeCardNumber) {
      return false;
    }

    // Must have an AI tag
    return getAiMode(card.tags) !== null;
  });

  // For each candidate, fetch full details to check column
  for (const cardSummary of aiCards) {
    const cardResult = await fizzyClient.cards.getByNumber(cardSummary.number);
    if (!cardResult.ok) {
      continue;
    }

    const card = cardResult.value;

    // Skip closed cards
    if (card.closed) {
      continue;
    }

    // Check if in an Accepted column
    if (!isAcceptedColumn(card.column?.name)) {
      continue;
    }

    // Determine the mode from tags
    const mode = getAiMode(card.tags);
    if (!mode) {
      continue;
    }

    return {
      number: card.number,
      title: card.title,
      description: card.description,
      tags: card.tags,
      mode,
    };
  }

  return null;
}

/**
 * Scans a board for available AI work and returns queue information.
 *
 * This provides a fuller picture of the work queue, including how many
 * cards are waiting beyond the next one.
 *
 * @param fizzyClient - The Fizzy API client
 * @param boardId - The board ID to scan
 * @param excludeCardNumber - Optional card number to exclude
 * @returns Scan result with next card and queue length
 *
 * @example
 * ```typescript
 * const result = await scanForWork(client, 'board-123');
 * if (result.found) {
 *   console.log(`Next: #${result.card!.number}`);
 *   console.log(`${result.queueLength} more cards waiting`);
 * }
 * ```
 */
export async function scanForWork(
  fizzyClient: FizzyClient,
  boardId: string,
  excludeCardNumber?: number,
): Promise<ScanResult> {
  // Get cards from the board, sorted by oldest first (FIFO)
  const cardsResult = await fizzyClient.cards.list({
    board_ids: [boardId],
    sorted_by: 'oldest',
  });

  if (!cardsResult.ok) {
    return { found: false, card: null, queueLength: 0 };
  }

  // Filter for AI-tagged cards
  const aiCards = cardsResult.value.filter((card) => {
    if (excludeCardNumber !== undefined && card.number === excludeCardNumber) {
      return false;
    }
    return getAiMode(card.tags) !== null;
  });

  const eligibleCards: CardForWork[] = [];

  // Check each card for eligibility
  for (const cardSummary of aiCards) {
    const cardResult = await fizzyClient.cards.getByNumber(cardSummary.number);
    if (!cardResult.ok) {
      continue;
    }

    const card = cardResult.value;

    // Skip closed cards
    if (card.closed) {
      continue;
    }

    // Check if in an Accepted column
    if (!isAcceptedColumn(card.column?.name)) {
      continue;
    }

    const mode = getAiMode(card.tags);
    if (!mode) {
      continue;
    }

    eligibleCards.push({
      number: card.number,
      title: card.title,
      description: card.description,
      tags: card.tags,
      mode,
    });
  }

  if (eligibleCards.length === 0) {
    return { found: false, card: null, queueLength: 0 };
  }

  return {
    found: true,
    card: eligibleCards[0] ?? null,
    queueLength: eligibleCards.length - 1,
  };
}

/**
 * Formats a completion summary for display.
 *
 * @param cardNumber - The completed card number
 * @param title - The card title
 * @param mode - The AI mode that was executed
 * @param prUrl - Optional PR URL (for ai-code mode)
 * @returns Formatted summary string
 */
export function formatCompletionSummary(
  cardNumber: number,
  title: string,
  mode: 'ai-code' | 'ai-plan',
  prUrl?: string,
): string {
  const modeLabel = mode === 'ai-code' ? 'Code' : 'Plan';
  let summary = `Card #${cardNumber} completed (${modeLabel}): ${title}`;

  if (prUrl) {
    summary += `\n  PR: ${prUrl}`;
  }

  return summary;
}

/**
 * Formats a "scanning for work" status message.
 *
 * @param boardName - Name of the board being scanned
 * @returns Formatted status string
 */
export function formatScanningStatus(boardName: string): string {
  return `Scanning for next card on "${boardName}"...`;
}

/**
 * Formats a "starting next card" status message.
 *
 * @param card - The card being started
 * @returns Formatted status string
 */
export function formatStartingCard(card: CardForWork): string {
  return `Starting card #${card.number}: ${card.title} (${card.mode})`;
}

/**
 * Formats a "no more cards" status message.
 *
 * @returns Formatted status string
 */
export function formatNoMoreCards(): string {
  return 'No more cards to process. Waiting for new work...';
}

/**
 * Formats a queue status message.
 *
 * @param queueLength - Number of cards waiting
 * @returns Formatted status string
 */
export function formatQueueStatus(queueLength: number): string {
  if (queueLength === 0) {
    return 'Queue is empty';
  }
  if (queueLength === 1) {
    return '1 more card waiting';
  }
  return `${queueLength} more cards waiting`;
}
