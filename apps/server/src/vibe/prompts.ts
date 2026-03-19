/**
 * Interactive prompts for Vibe Mode board selection.
 *
 * Uses @inquirer/prompts for a clean, interactive CLI experience.
 */

import { select, confirm } from '@inquirer/prompts';
import type { BoardWithConfig } from './detector.js';
import { colors } from '../ui/branding.js';

/**
 * Prompts the user to select a board from a list of available boards.
 *
 * @param boards - List of boards with their configs and ready card counts
 * @returns The selected board, or null if cancelled
 */
export async function selectBoard(boards: BoardWithConfig[]): Promise<BoardWithConfig | null> {
  if (boards.length === 0) {
    return null;
  }

  if (boards.length === 1) {
    // Auto-select single board
    return boards[0]!;
  }

  try {
    const choices = boards.map((board) => {
      const readyLabel =
        board.readyCards > 0
          ? colors.success(` (${board.readyCards} cards ready)`)
          : colors.muted(' (no cards ready)');

      return {
        name: `${board.name}${readyLabel}`,
        value: board,
        description: `Repository: ${board.config.repository}`,
      };
    });

    const selected = await select<BoardWithConfig>({
      message: 'Select a board to work on:',
      choices,
    });

    return selected;
  } catch {
    // User cancelled (Ctrl+C)
    return null;
  }
}

/**
 * Prompts the user to confirm that the detected repository matches their intent.
 *
 * @param repoUrl - The detected repository URL
 * @param boardName - The board name that matches
 * @returns true if confirmed, false otherwise
 */
export async function confirmRepo(repoUrl: string, boardName: string): Promise<boolean> {
  try {
    return await confirm({
      message: `Use board "${boardName}" for repository ${repoUrl}?`,
      default: true,
    });
  } catch {
    // User cancelled
    return false;
  }
}

/**
 * Prompts the user to confirm board selection when no repo match is found.
 *
 * @param boardName - The board name
 * @returns true if confirmed, false otherwise
 */
export async function confirmBoardSelection(boardName: string): Promise<boolean> {
  try {
    return await confirm({
      message: `Start vibe mode with board "${boardName}"?`,
      default: true,
    });
  } catch {
    return false;
  }
}

/**
 * Result of board selection process.
 */
export interface BoardSelectionResult {
  board: BoardWithConfig;
  matchedByRepo: boolean;
}

/**
 * Runs the full board selection flow.
 *
 * Priority:
 * 1. If --board flag provided, use that
 * 2. If in git repo, find matching boards by repository URL
 * 3. If no match or not in repo, show selection prompt
 *
 * @param boards - All available boards with configs
 * @param repoUrl - Current repository URL (if detected)
 * @param requestedBoardId - Board ID from --board flag (if provided)
 * @returns Selected board info or null if cancelled
 */
export async function runBoardSelection(
  boards: BoardWithConfig[],
  repoUrl: string | null,
  requestedBoardId?: string,
): Promise<BoardSelectionResult | null> {
  // If board ID was provided via flag, find it
  if (requestedBoardId) {
    const board = boards.find((b) => b.id === requestedBoardId);
    if (board) {
      return { board, matchedByRepo: false };
    }
    // Board not found - fall through to selection
    console.error(colors.warning(`Board ID "${requestedBoardId}" not found or not configured`));
  }

  // If we have a repo URL, try to match boards
  if (repoUrl) {
    const matchingBoards = boards.filter((b) => {
      // Normalize both URLs for comparison
      const configRepo = b.config.repository.toLowerCase().replace(/\.git$/, '');
      const currentRepo = repoUrl.toLowerCase().replace(/\.git$/, '');
      return configRepo === currentRepo;
    });

    if (matchingBoards.length === 1) {
      // Single match - confirm and use
      const board = matchingBoards[0]!;
      const confirmed = await confirmRepo(repoUrl, board.name);
      if (confirmed) {
        return { board, matchedByRepo: true };
      }
      // User declined - fall through to selection
    } else if (matchingBoards.length > 1) {
      // Multiple matches - let user choose from matches
      console.error(colors.text('Multiple boards match this repository:'));
      const selected = await selectBoard(matchingBoards);
      if (selected) {
        return { board: selected, matchedByRepo: true };
      }
      // User cancelled
      return null;
    }
  }

  // No repo match - show all boards
  if (boards.length === 0) {
    return null;
  }

  console.error(colors.text('No matching board found for this repository.'));
  const selected = await selectBoard(boards);
  if (selected) {
    const confirmed = await confirmBoardSelection(selected.name);
    if (confirmed) {
      return { board: selected, matchedByRepo: false };
    }
  }

  return null;
}
