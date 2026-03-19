import { z } from 'zod';
import * as yaml from 'yaml';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { FizzyClient } from '@fizzy-do-mcp/client';
import {
  VibeConfigSchema,
  VIBE_COLUMNS,
  CONFIG_CARD_TEMPLATE,
  CONFIG_CARD_TITLE,
  CONFIG_CARD_TAG,
  type VibeConfig,
  type VibeColumnName,
  type BoardVibeStatus,
} from '@fizzy-do-mcp/shared';
import { formatToolSuccess, formatToolError } from '../utils.js';

/**
 * Parse YAML config from card description.
 * Handles both raw YAML and markdown code blocks.
 */
function parseConfigYaml(description: string | null): { config: VibeConfig; raw: string } | null {
  if (!description) return null;

  // Try to extract YAML from markdown code block first
  const codeBlockMatch = description.match(/```(?:ya?ml)?\s*([\s\S]*?)```/i);
  const yamlContent = codeBlockMatch?.[1]?.trim() ?? description.trim();

  try {
    const parsed = yaml.parse(yamlContent);
    const validated = VibeConfigSchema.parse(parsed);
    return { config: validated, raw: yamlContent };
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

    // Exact matches
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
 * Registers Vibe Coding tools with the MCP server.
 *
 * These tools enable AI assistants to set up and manage Vibe Coding
 * configuration on Fizzy boards, including config cards and standard columns.
 */
export function registerVibeTools(server: McpServer, client: FizzyClient): void {
  // Create Config Card
  server.tool(
    'fizzy_vibe_create_config',
    `Create a Vibe Coding configuration card on a board.

This creates a card with the #ai-config tag containing a YAML template
that the user can customize with their repository settings.

Only ONE config card is allowed per board. If one already exists,
this tool will return an error.

The config card should be placed in the "Maybe" column and never moved.`,
    {
      board_id: z.string().describe('The board ID to create the config card on'),
      repository: z
        .string()
        .url()
        .optional()
        .describe('GitHub repository URL (if known). Otherwise a placeholder is used.'),
    },
    async ({ board_id, repository }) => {
      // First check if a config card already exists
      const cardsResult = await client.cards.list({ board_ids: [board_id] });
      if (!cardsResult.ok) {
        return formatToolError(cardsResult.error);
      }

      const existingConfig = cardsResult.value.find((card) =>
        card.tags.some((tag) => tag.toLowerCase() === CONFIG_CARD_TAG),
      );

      if (existingConfig) {
        return formatToolError({
          code: 'VALIDATION_ERROR',
          message: `Board already has a config card: #${existingConfig.number} "${existingConfig.title}"`,
          retryable: false,
        } as never);
      }

      // Create the config card with template
      let description = CONFIG_CARD_TEMPLATE;
      if (repository) {
        description = description.replace('https://github.com/your-org/your-repo', repository);
      }

      const createResult = await client.cards.create(board_id, {
        title: CONFIG_CARD_TITLE,
        description,
        status: 'published',
        tag_ids: [], // We'll add the tag after creation
      });

      if (!createResult.ok) {
        return formatToolError(createResult.error);
      }

      // Add the ai-config tag
      const tagResult = await client.cards.toggleTag(createResult.value.number, CONFIG_CARD_TAG);
      if (!tagResult.ok) {
        // Card was created but tag failed - still return success with warning
        return formatToolSuccess(
          {
            card_number: createResult.value.number,
            card_url: createResult.value.url,
            warning: 'Card created but failed to add #ai-config tag. Please add it manually.',
          },
          `Created config card #${createResult.value.number} (tag may need manual addition)`,
        );
      }

      return formatToolSuccess(
        {
          card_number: createResult.value.number,
          card_url: createResult.value.url,
          next_steps: [
            'Edit the card description to set your repository URL',
            'Move the card to the "Maybe" column',
            'Run fizzy_vibe_setup_columns to create standard workflow columns',
          ],
        },
        `Created config card #${createResult.value.number} with #ai-config tag`,
      );
    },
  );

  // Get Config
  server.tool(
    'fizzy_vibe_get_config',
    `Read and parse the Vibe Coding configuration from a board's config card.

Looks for a card with the #ai-config tag and parses its YAML description.
Returns the parsed configuration or an error if not found/invalid.`,
    {
      board_id: z.string().describe('The board ID to get config from'),
    },
    async ({ board_id }) => {
      // Find the config card
      const cardsResult = await client.cards.list({ board_ids: [board_id] });
      if (!cardsResult.ok) {
        return formatToolError(cardsResult.error);
      }

      const configCard = cardsResult.value.find((card) =>
        card.tags.some((tag) => tag.toLowerCase() === CONFIG_CARD_TAG),
      );

      if (!configCard) {
        return formatToolError({
          code: 'NOT_FOUND',
          message: 'No config card found. Create one with fizzy_vibe_create_config.',
          retryable: false,
        } as never);
      }

      // Get full card details for description
      const cardResult = await client.cards.getByNumber(configCard.number);
      if (!cardResult.ok) {
        return formatToolError(cardResult.error);
      }

      // Parse the YAML config
      const parsed = parseConfigYaml(cardResult.value.description);
      if (!parsed) {
        return formatToolError({
          code: 'VALIDATION_ERROR',
          message: 'Config card has invalid or missing YAML configuration.',
          retryable: false,
        } as never);
      }

      return formatToolSuccess(
        {
          card_number: configCard.number,
          card_url: configCard.url,
          config: parsed.config,
        },
        `Found valid config for repository: ${parsed.config.repository}`,
      );
    },
  );

  // Validate Config
  server.tool(
    'fizzy_vibe_validate_config',
    `Validate a Vibe Coding configuration YAML string.

Use this to check if a config is valid before saving it to a card.
Returns validation errors if the config is invalid.`,
    {
      yaml_content: z.string().describe('The YAML configuration content to validate'),
    },
    async ({ yaml_content }) => {
      try {
        const parsed = yaml.parse(yaml_content);
        const validated = VibeConfigSchema.parse(parsed);

        return formatToolSuccess(
          {
            valid: true,
            config: validated,
          },
          'Configuration is valid',
        );
      } catch (error) {
        if (error instanceof z.ZodError) {
          return formatToolSuccess(
            {
              valid: false,
              errors: error.errors.map((e) => ({
                path: e.path.join('.'),
                message: e.message,
              })),
            },
            'Configuration has validation errors',
          );
        }

        return formatToolSuccess(
          {
            valid: false,
            errors: [{ path: 'yaml', message: 'Invalid YAML syntax' }],
          },
          'Configuration has YAML syntax errors',
        );
      }
    },
  );

  // Setup Columns
  server.tool(
    'fizzy_vibe_setup_columns',
    `Set up standard Vibe Coding workflow columns on a board.

Creates any missing columns from the standard set:
- Maybe (Gray): Initial card creation and editing. AI ignores cards here.
- Accepted (Blue): Approved and ready for AI work. AI picks up cards from here.
- In Progress (Yellow): Currently being worked on by AI.
- Blocked (Pink): Work failed or needs human intervention.

Existing columns with matching names are preserved and reused.`,
    {
      board_id: z.string().describe('The board ID to set up columns on'),
      dry_run: z
        .boolean()
        .optional()
        .default(false)
        .describe('If true, only report what would be created without making changes'),
    },
    async ({ board_id, dry_run }) => {
      // Get existing columns
      const columnsResult = await client.columns.list(board_id);
      if (!columnsResult.ok) {
        return formatToolError(columnsResult.error);
      }

      const existingColumns = columnsResult.value;
      const mapping = matchColumnsToVibeRoles(existingColumns);

      // Determine which columns need to be created
      const vibeColumnKeys: VibeColumnName[] = ['Maybe', 'Accepted', 'InProgress', 'Blocked'];
      const toCreate: VibeColumnName[] = [];
      const existing: Array<{ role: VibeColumnName; id: string; name: string }> = [];

      for (const key of vibeColumnKeys) {
        const existingId = mapping.get(key);
        if (existingId) {
          const col = existingColumns.find((c) => c.id === existingId);
          existing.push({ role: key, id: existingId, name: col?.name ?? key });
        } else {
          toCreate.push(key);
        }
      }

      if (dry_run) {
        return formatToolSuccess(
          {
            dry_run: true,
            existing_columns: existing,
            columns_to_create: toCreate.map((key) => ({
              name: VIBE_COLUMNS[key].name,
              color: VIBE_COLUMNS[key].color,
              description: VIBE_COLUMNS[key].description,
            })),
          },
          `Would create ${toCreate.length} column(s), ${existing.length} already exist`,
        );
      }

      // Create missing columns
      const created: Array<{ role: VibeColumnName; id: string; name: string }> = [];
      const errors: Array<{ role: VibeColumnName; error: string }> = [];

      for (const key of toCreate) {
        const columnDef = VIBE_COLUMNS[key];
        const createResult = await client.columns.create(board_id, {
          name: columnDef.name,
          color: columnDef.color,
        });

        if (createResult.ok) {
          created.push({ role: key, id: createResult.value.id, name: createResult.value.name });
        } else {
          errors.push({ role: key, error: createResult.error.message });
        }
      }

      const allColumns = [...existing, ...created];
      const success = errors.length === 0;

      return formatToolSuccess(
        {
          success,
          existing_columns: existing,
          created_columns: created,
          errors: errors.length > 0 ? errors : undefined,
          column_mapping: Object.fromEntries(allColumns.map((c) => [c.role, c.id])),
        },
        success
          ? `Created ${created.length} column(s), ${existing.length} already existed`
          : `Created ${created.length} column(s) with ${errors.length} error(s)`,
      );
    },
  );

  // Get Board Vibe Status
  server.tool(
    'fizzy_vibe_board_status',
    `Get the Vibe Coding status and readiness of a board.

Returns comprehensive information about:
- Whether a config card exists and is valid
- Which standard columns exist vs need to be created
- How many cards are ready for AI work (in Accepted with AI tags)
- Overall readiness for vibe coding`,
    {
      board_id: z.string().describe('The board ID to check'),
    },
    async ({ board_id }) => {
      // Get board details
      const boardResult = await client.boards.getById(board_id);
      if (!boardResult.ok) {
        return formatToolError(boardResult.error);
      }

      // Get columns
      const columnsResult = await client.columns.list(board_id);
      if (!columnsResult.ok) {
        return formatToolError(columnsResult.error);
      }

      // Get cards to find config and count ready cards
      const cardsResult = await client.cards.list({ board_ids: [board_id] });
      if (!cardsResult.ok) {
        return formatToolError(cardsResult.error);
      }

      // Find config card
      const configCard = cardsResult.value.find((card) =>
        card.tags.some((tag) => tag.toLowerCase() === CONFIG_CARD_TAG),
      );

      let config: VibeConfig | undefined;
      let hasValidConfig = false;

      if (configCard) {
        const cardResult = await client.cards.getByNumber(configCard.number);
        if (cardResult.ok) {
          const parsed = parseConfigYaml(cardResult.value.description);
          if (parsed) {
            config = parsed.config;
            hasValidConfig = true;
          }
        }
      }

      // Analyze columns
      const existingColumns = columnsResult.value;
      const mapping = matchColumnsToVibeRoles(existingColumns);

      const vibeColumnKeys: VibeColumnName[] = ['Maybe', 'Accepted', 'InProgress', 'Blocked'];
      const missing: VibeColumnName[] = [];

      const columnStatus = existingColumns.map((col) => {
        let vibeRole: VibeColumnName | undefined;
        for (const [role, id] of mapping.entries()) {
          if (id === col.id) {
            vibeRole = role;
            break;
          }
        }
        return {
          id: col.id,
          name: col.name,
          is_vibe_column: vibeRole !== undefined,
          vibe_role: vibeRole,
        };
      });

      for (const key of vibeColumnKeys) {
        if (!mapping.has(key)) {
          missing.push(key);
        }
      }

      // Count cards ready for AI work (AI-tagged cards)
      // Note: We can't check column without fetching full card details
      const readyCards = cardsResult.value.filter((card) => {
        // Must have AI tag
        const hasAiTag = card.tags.some(
          (tag) => tag.toLowerCase() === 'ai-code' || tag.toLowerCase() === 'ai-plan',
        );
        if (!hasAiTag) return false;

        // Must be in Accepted column (need to get full card for column info)
        // For now, we'll count all AI-tagged cards not in progress
        return true;
      }).length;

      const isReady = hasValidConfig && missing.length === 0;

      const status: BoardVibeStatus = {
        board_id,
        board_name: boardResult.value.name,
        has_config: hasValidConfig,
        config,
        columns: {
          existing: columnStatus,
          missing,
        },
        ready_cards: readyCards,
        is_ready: isReady,
      };

      return formatToolSuccess(
        status,
        isReady
          ? `Board "${boardResult.value.name}" is ready for vibe coding with ${readyCards} card(s) available`
          : `Board "${boardResult.value.name}" needs setup: ${!hasValidConfig ? 'missing config, ' : ''}${missing.length > 0 ? `missing columns: ${missing.join(', ')}` : ''}`,
      );
    },
  );
}
