/**
 * Vibe Mode entry point.
 *
 * Vibe Mode is an autonomous AI project manager that connects to a Cloudflare
 * Worker and executes AI work on Fizzy cards. Users run `npx fizzy-do-mcp --vibe`
 * to start a session.
 *
 * This module handles:
 * - Git repository detection and board matching
 * - Interactive board selection
 * - Board validation and column setup
 * - Session initialization
 */

import * as yaml from 'yaml';
import { FizzyClient } from '@fizzy-do-mcp/client';
import {
  VIBE_COLUMNS,
  CONFIG_CARD_TAG,
  VibeConfigSchema,
  type VibeConfig,
  type VibeColumnName,
} from '@fizzy-do-mcp/shared';
import { resolveConfig, isConfigured } from '../credentials.js';
import { withSpinner, showSuccess, showInfo, showWarning } from '../ui/spinner.js';
import { colors } from '../ui/branding.js';
import {
  displayVibeHeader,
  displayRepoInfo,
  displayWaiting,
  displayVibeError,
  displayColumnSetup,
} from '../ui/vibe-display.js';
import { detectGitRepo, type BoardWithConfig } from './detector.js';
import { runBoardSelection } from './prompts.js';
import { VibeClient } from './client.js';
import { executeWork } from './executor.js';
import {
  scanForWork,
  formatCompletionSummary,
  formatScanningStatus,
  formatStartingCard,
  formatNoMoreCards,
  formatQueueStatus,
} from './continuation.js';

/**
 * Options for starting vibe mode.
 */
export interface VibeOptions {
  /** Board ID to work on (from --board flag) */
  boardId?: string | undefined;
}

/**
 * Parse YAML config from card description.
 * Handles both raw YAML and markdown code blocks.
 */
function parseConfigYaml(description: string | null): VibeConfig | null {
  if (!description) return null;

  // Try to extract YAML from markdown code block first
  const codeBlockMatch = description.match(/```(?:ya?ml)?\s*([\s\S]*?)```/i);
  const yamlContent = codeBlockMatch?.[1]?.trim() ?? description.trim();

  try {
    const parsed = yaml.parse(yamlContent);
    const validated = VibeConfigSchema.parse(parsed);
    return validated;
  } catch {
    return null;
  }
}

/**
 * Match existing columns to vibe column roles.
 */
function matchColumnsToVibeRoles(
  columns: Array<{ id: string; name: string }>,
): Map<VibeColumnName, string> {
  const mapping = new Map<VibeColumnName, string>();

  for (const column of columns) {
    const normalizedName = column.name.toLowerCase().trim();

    if (normalizedName === 'maybe') {
      mapping.set('Maybe', column.id);
    } else if (
      normalizedName === 'accepted' ||
      normalizedName === 'to do' ||
      normalizedName === 'todo'
    ) {
      mapping.set('Accepted', column.id);
    } else if (
      normalizedName === 'in progress' ||
      normalizedName === 'in-progress' ||
      normalizedName === 'doing' ||
      normalizedName === 'working'
    ) {
      mapping.set('InProgress', column.id);
    } else if (
      normalizedName === 'blocked' ||
      normalizedName === 'stuck' ||
      normalizedName === 'needs help'
    ) {
      mapping.set('Blocked', column.id);
    }
  }

  return mapping;
}

/**
 * Fetches all boards with AI-config cards and their ready card counts.
 */
async function fetchBoardsWithConfig(client: FizzyClient): Promise<BoardWithConfig[]> {
  // Get all boards
  const boardsResult = await client.boards.list();
  if (!boardsResult.ok) {
    throw new Error(`Failed to fetch boards: ${boardsResult.error.message}`);
  }

  // Get all cards to find config cards and count ready cards
  const cardsResult = await client.cards.list({});
  if (!cardsResult.ok) {
    throw new Error(`Failed to fetch cards: ${cardsResult.error.message}`);
  }

  const boardsWithConfig: BoardWithConfig[] = [];

  for (const board of boardsResult.value) {
    // Find config card for this board
    const configCard = cardsResult.value.find(
      (card) =>
        card.board.id === board.id &&
        card.tags.some((tag) => tag.toLowerCase() === CONFIG_CARD_TAG),
    );

    if (!configCard) {
      continue;
    }

    // Get full card details to parse config
    const cardResult = await client.cards.getByNumber(configCard.number);
    if (!cardResult.ok) {
      continue;
    }

    const config = parseConfigYaml(cardResult.value.description);
    if (!config) {
      continue;
    }

    // Count ready cards (AI-tagged cards in this board, not closed)
    // Note: 'closed' is only available on detail view, so we filter by board only
    const readyCards = cardsResult.value.filter((card) => {
      if (card.board.id !== board.id) return false;
      return card.tags.some(
        (tag) => tag.toLowerCase() === 'ai-code' || tag.toLowerCase() === 'ai-plan',
      );
    }).length;

    boardsWithConfig.push({
      id: board.id,
      name: board.name,
      config,
      cardNumber: configCard.number,
      readyCards,
    });
  }

  return boardsWithConfig;
}

/**
 * Sets up standard vibe columns on a board, creating any missing ones.
 */
async function setupVibeColumns(
  client: FizzyClient,
  boardId: string,
): Promise<{ created: string[]; existing: string[] }> {
  // Get existing columns
  const columnsResult = await client.columns.list(boardId);
  if (!columnsResult.ok) {
    throw new Error(`Failed to fetch columns: ${columnsResult.error.message}`);
  }

  const existingColumns = columnsResult.value;
  const mapping = matchColumnsToVibeRoles(existingColumns);

  const vibeColumnKeys: VibeColumnName[] = ['Maybe', 'Accepted', 'InProgress', 'Blocked'];
  const created: string[] = [];
  const existing: string[] = [];

  for (const key of vibeColumnKeys) {
    const existingId = mapping.get(key);
    if (existingId) {
      const col = existingColumns.find((c) => c.id === existingId);
      if (col) {
        existing.push(col.name);
      }
    } else {
      // Create missing column
      const columnDef = VIBE_COLUMNS[key];
      const createResult = await client.columns.create(boardId, {
        name: columnDef.name,
        color: columnDef.color,
      });

      if (createResult.ok) {
        created.push(createResult.value.name);
      }
    }
  }

  return { created, existing };
}

/**
 * Handles board continuation after completing or failing work on a card.
 *
 * Scans for the next available card and displays status information.
 * The server manages the actual work queue, but this provides local feedback.
 *
 * @param fizzyClient - The Fizzy API client
 * @param boardId - The board ID to scan
 * @param boardName - The board name for display
 * @param completedCardNumber - The card that was just completed
 * @param vibeClient - The vibe client to signal readiness
 */
async function handleContinuation(
  fizzyClient: FizzyClient,
  boardId: string,
  boardName: string,
  completedCardNumber: number,
  vibeClient: VibeClient,
): Promise<void> {
  // Display scanning status
  console.error('');
  showInfo(formatScanningStatus(boardName));

  // Scan for next available work
  const scanResult = await scanForWork(fizzyClient, boardId, completedCardNumber);

  if (scanResult.found && scanResult.card) {
    // Show what's next and queue status
    showInfo(formatStartingCard(scanResult.card));
    if (scanResult.queueLength > 0) {
      showInfo(formatQueueStatus(scanResult.queueLength));
    }
  } else {
    // No more cards available
    showInfo(formatNoMoreCards());
  }

  // Signal readiness to the server - it manages the actual queue
  // The server will assign the next card (or none if queue is empty)
  console.error('');
  vibeClient.sendReady();
}

/**
 * Starts Vibe Mode - the autonomous AI project manager.
 *
 * This function:
 * 1. Validates authentication
 * 2. Detects the current git repository
 * 3. Fetches boards with #ai-config cards
 * 4. Matches or prompts for board selection
 * 5. Sets up workflow columns if needed
 * 6. Displays waiting state (WebSocket connection comes later)
 */
export async function startVibeMode(options: VibeOptions = {}): Promise<void> {
  displayVibeHeader();

  // Check authentication
  if (!isConfigured()) {
    displayVibeError(
      'Not authenticated',
      'Run "fizzy-do-mcp configure" first to set up authentication.',
    );
    process.exit(1);
  }

  const config = resolveConfig();
  if (!config) {
    displayVibeError('Invalid configuration', 'Run "fizzy-do-mcp configure" to reconfigure.');
    process.exit(1);
  }

  // Detect git repository
  let repoInfo;
  try {
    repoInfo = await withSpinner('Detecting git repository...', async () => {
      return await detectGitRepo();
    });
  } catch {
    repoInfo = null;
  }

  if (repoInfo) {
    displayRepoInfo(repoInfo.path, repoInfo.repoUrl, repoInfo.currentBranch, repoInfo.isClean);

    if (!repoInfo.isClean) {
      showWarning(`Working directory has ${repoInfo.uncommittedChanges} uncommitted change(s)`);
    }
  } else {
    showInfo('Not in a git repository - will use manual board selection');
  }

  // Create Fizzy client
  const client = new FizzyClient({
    accessToken: config.accessToken,
    ...(config.accountSlug ? { accountSlug: config.accountSlug } : {}),
    baseUrl: config.baseUrl,
  });

  // Fetch boards with configs
  let boards: BoardWithConfig[];
  try {
    boards = await withSpinner('Fetching boards...', async () => {
      return await fetchBoardsWithConfig(client);
    });
  } catch (error) {
    displayVibeError(
      'Failed to fetch boards',
      error instanceof Error ? error.message : 'Unknown error',
    );
    process.exit(1);
  }

  if (boards.length === 0) {
    displayVibeError(
      'No boards configured for vibe coding',
      'Create a card with #ai-config tag containing your repository configuration.',
    );
    process.exit(1);
  }

  showSuccess(`Found ${boards.length} board(s) with vibe config`);

  // Select board
  const selection = await runBoardSelection(boards, repoInfo?.repoUrl ?? null, options.boardId);

  if (!selection) {
    showInfo('Cancelled');
    process.exit(0);
  }

  const { board, matchedByRepo } = selection;

  if (matchedByRepo) {
    showSuccess(`Matched board "${board.name}" to current repository`);
  }

  // Validate board has #ai-config card (already validated by fetchBoardsWithConfig)
  console.error('');
  showInfo(`Using board: ${colors.primaryBright(board.name)}`);
  showInfo(`Config card: #${board.cardNumber}`);

  // Set up columns
  console.error('');
  let columnSetup;
  try {
    columnSetup = await withSpinner('Setting up workflow columns...', async () => {
      return await setupVibeColumns(client, board.id);
    });
  } catch (error) {
    displayVibeError(
      'Failed to set up columns',
      error instanceof Error ? error.message : 'Unknown error',
    );
    process.exit(1);
  }

  if (columnSetup.created.length > 0 || columnSetup.existing.length > 0) {
    displayColumnSetup(columnSetup.created, columnSetup.existing);
  }

  // Display waiting state
  console.error('');
  displayWaiting(board.name, board.config);

  // Connect to the vibe WebSocket server
  const vibeClient = new VibeClient({
    endpoint: process.env.VIBE_WS_ENDPOINT ?? 'wss://mcp.fizzy.yogan.dev/vibe/ws',
    boardId: board.id,
    fizzyToken: config.accessToken,
    repoPath: repoInfo?.path ?? process.cwd(),
  });

  // Set up event handlers
  vibeClient.on('connected', (sessionId) => {
    showSuccess(`Connected to vibe server (session: ${sessionId.slice(0, 8)}...)`);
    vibeClient.sendReady();
  });

  vibeClient.on('disconnected', (error) => {
    if (error) {
      showWarning(`Disconnected: ${error.message}. Reconnecting...`);
    } else {
      showWarning('Disconnected from vibe server. Reconnecting...');
    }
  });

  vibeClient.on('work', (card, mode, vibeConfig) => {
    // Log the work assignment
    console.error('');
    showInfo(
      `Received work: ${colors.primaryBright(`#${card.number}`)} ${colors.text(card.title)}`,
    );
    showInfo(`Mode: ${colors.primary(mode)}`);
    showInfo(`Repository: ${colors.muted(vibeConfig.repository)}`);
    console.error('');

    // Execute the work asynchronously
    void (async () => {
      try {
        const result = await executeWork({
          card,
          mode,
          config: vibeConfig,
          vibeClient,
          fizzyClient: client,
          repoPath: repoInfo?.path ?? process.cwd(),
        });

        // Display completion summary
        console.error('');
        if (result.success) {
          showSuccess(formatCompletionSummary(card.number, card.title, mode, result.prUrl));
        } else {
          showWarning(`Work failed: ${result.error ?? 'Unknown error'}`);
        }

        // Scan for next card and display continuation status
        await handleContinuation(client, board.id, board.name, card.number, vibeClient);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        showWarning(`Unexpected error: ${errorMessage}`);
        vibeClient.sendWorkFailed(card.number, errorMessage);

        // Still try to continue with next card
        await handleContinuation(client, board.id, board.name, card.number, vibeClient);
      }
    })();
  });

  vibeClient.on('cancelled', (cardNumber, reason) => {
    showWarning(`Work cancelled for card #${cardNumber}: ${reason}`);
  });

  vibeClient.on('queue', (cardsWaiting, position) => {
    if (position !== undefined) {
      showInfo(`Queue status: ${cardsWaiting} cards waiting, position ${position}`);
    } else {
      showInfo(`Queue status: ${cardsWaiting} cards waiting`);
    }
  });

  vibeClient.on('error', (code, message) => {
    displayVibeError(`Server error [${code}]`, message);
  });

  // Handle graceful shutdown
  const shutdown = () => {
    console.error('');
    showInfo('Shutting down...');
    vibeClient.disconnect();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  // Connect to the server
  try {
    await vibeClient.connect();
  } catch (error) {
    displayVibeError(
      'Failed to connect to vibe server',
      error instanceof Error ? error.message : 'Unknown error',
    );
    process.exit(1);
  }

  showInfo('Press Ctrl+C to exit');

  // Keep the process running
  await new Promise(() => {
    // Never resolves - wait for Ctrl+C
  });
}
