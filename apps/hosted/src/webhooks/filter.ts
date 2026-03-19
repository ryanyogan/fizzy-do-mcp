/**
 * AI Tag Filtering
 *
 * Determines whether a card should be processed by AI based on its tags
 * and column placement.
 */

import { VIBE_COLUMNS, type AiWorkMode } from '@fizzy-do-mcp/shared';

/**
 * AI tag prefixes to look for on cards.
 */
const AI_TAG_PREFIX = 'ai-';
const AI_CODE_TAG = 'ai-code';
const AI_PLAN_TAG = 'ai-plan';
const AI_CONFIG_TAG = 'ai-config';

/**
 * Columns where AI work should be triggered.
 * Includes standard vibe column name plus common alternatives.
 */
const WORK_TRIGGER_COLUMNS = [
  VIBE_COLUMNS.Accepted.name,
  'To Do',
  'Todo',
  'Ready',
  'Ready for Work',
  'Backlog',
];

/**
 * Columns where AI work should be ignored.
 */
const IGNORE_COLUMNS = [
  VIBE_COLUMNS.Maybe.name,
  VIBE_COLUMNS.InProgress.name,
  VIBE_COLUMNS.Blocked.name,
];

/**
 * Card data structure for filtering decisions.
 */
export interface CardData {
  number: number;
  title: string;
  description: string | null;
  tags: string[];
  board_id: string;
  column?:
    | {
        id: string;
        name: string;
      }
    | undefined;
}

/**
 * Check if a card has any AI-related tags.
 *
 * @param tags - Array of tag names (without # prefix)
 * @returns True if the card has AI tags
 */
export function isAiTaggedCard(tags: string[]): boolean {
  return tags.some(
    (tag) => tag.toLowerCase().startsWith(AI_TAG_PREFIX) && tag.toLowerCase() !== AI_CONFIG_TAG,
  );
}

/**
 * Get the AI work mode based on card tags.
 *
 * Priority: ai-code > ai-plan
 *
 * @param tags - Array of tag names (without # prefix)
 * @returns The AI work mode, or null if no AI tags
 */
export function getAiWorkMode(tags: string[]): AiWorkMode | null {
  const normalizedTags = tags.map((t) => t.toLowerCase());

  if (normalizedTags.includes(AI_CODE_TAG)) {
    return 'ai-code';
  }

  if (normalizedTags.includes(AI_PLAN_TAG)) {
    return 'ai-plan';
  }

  return null;
}

/**
 * Determine if a card should be processed by AI.
 *
 * A card should be processed if:
 * 1. It has an AI work tag (ai-code or ai-plan)
 * 2. It is NOT an ai-config card
 * 3. It is in the "Accepted" column (or column check is skipped)
 *
 * @param card - Card data to check
 * @param columnName - Optional column name to validate (if not in card data)
 * @returns True if the card should be processed
 */
export function shouldProcessCard(card: CardData, columnName?: string): boolean {
  // Check for AI work tags
  const mode = getAiWorkMode(card.tags);
  if (!mode) {
    return false;
  }

  // Ignore ai-config cards
  if (card.tags.some((t) => t.toLowerCase() === AI_CONFIG_TAG)) {
    return false;
  }

  // Get the column name (from card data or parameter)
  const column = columnName ?? card.column?.name;

  // If no column info, we can't validate placement
  if (!column) {
    // Without column info, default to processing if AI-tagged
    // This handles cases where column info isn't available
    return true;
  }

  // Check if card is in a work-trigger column
  if (WORK_TRIGGER_COLUMNS.some((c) => c.toLowerCase() === column.toLowerCase())) {
    return true;
  }

  // Card is in an ignored column
  if (IGNORE_COLUMNS.some((c) => c.toLowerCase() === column.toLowerCase())) {
    return false;
  }

  // For non-standard columns, default to not processing
  // Cards must explicitly be in "Accepted" to trigger work
  return false;
}

/**
 * Check if a column name matches a work trigger column.
 *
 * Accepts the standard "Accepted" column plus common alternatives.
 *
 * @param columnName - Column name to check
 * @returns True if the column triggers AI work
 */
export function isAcceptedColumn(columnName: string): boolean {
  const normalized = columnName.toLowerCase();
  return WORK_TRIGGER_COLUMNS.some((col) => col.toLowerCase() === normalized);
}

/**
 * Check if a comment body contains an AI start command.
 *
 * Recognized commands:
 * - @ai start
 * - @ai-start
 *
 * @param commentBody - The comment body text
 * @returns True if the comment contains a start command
 */
export function hasAiStartCommand(commentBody: string): boolean {
  const normalized = commentBody.toLowerCase().trim();
  return normalized.includes('@ai start') || normalized.includes('@ai-start');
}
