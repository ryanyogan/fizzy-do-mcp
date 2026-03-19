import { z } from 'zod';

/**
 * Standard columns for Vibe Coding workflow.
 *
 * These columns are auto-created on boards that participate in vibe mode:
 * - Maybe: Initial card creation and editing (AI ignores)
 * - Accepted: Approved and ready for AI work
 * - In Progress: Currently being worked on by AI
 * - Blocked: Work failed or needs human intervention
 */
export const VIBE_COLUMNS = {
  Maybe: {
    name: 'Maybe',
    color: 'var(--color-card-1)', // Gray
    description: 'Initial card creation and editing. AI ignores cards here.',
  },
  Accepted: {
    name: 'Accepted',
    color: 'var(--color-card-default)', // Blue
    description: 'Approved and ready for AI work. AI picks up cards from here.',
  },
  InProgress: {
    name: 'In Progress',
    color: 'var(--color-card-3)', // Yellow
    description: 'Currently being worked on by AI.',
  },
  Blocked: {
    name: 'Blocked',
    color: 'var(--color-card-8)', // Pink
    description: 'Work failed or needs human intervention.',
  },
} as const;

export type VibeColumnName = keyof typeof VIBE_COLUMNS;

/**
 * AI work modes for cards.
 */
export const AI_WORK_MODES = {
  'ai-code': {
    tag: 'ai-code',
    description: 'Write code, create branch, and submit PR',
  },
  'ai-plan': {
    tag: 'ai-plan',
    description: 'Break down card into steps and add implementation notes (no code)',
  },
} as const;

export type AiWorkMode = keyof typeof AI_WORK_MODES;

/**
 * Schema for the vibe config YAML content in the config card description.
 */
export const VibeConfigSchema = z.object({
  /** GitHub repository URL (required) */
  repository: z
    .string()
    .url()
    .refine(
      (url) => {
        try {
          const parsed = new URL(url);
          return parsed.hostname === 'github.com';
        } catch {
          return false;
        }
      },
      { message: 'Repository must be a valid GitHub URL' },
    ),

  /** Base branch for new feature branches (default: main) */
  default_branch: z.string().default('main'),

  /** Branch naming pattern. Supports {number} and {slug} placeholders */
  branch_pattern: z.string().default('ai/card-{number}-{slug}'),

  /** PR documentation level */
  pr_template: z.enum(['minimal', 'default', 'detailed']).default('default'),

  /** Whether to auto-assign PR to card assignees */
  auto_assign_pr: z.boolean().default(true),
});

export type VibeConfig = z.infer<typeof VibeConfigSchema>;

/**
 * Schema for a parsed vibe config card.
 */
export const VibeConfigCardSchema = z.object({
  /** Card number */
  card_number: z.number(),

  /** Card ID */
  card_id: z.string(),

  /** Board ID this config belongs to */
  board_id: z.string(),

  /** Parsed configuration */
  config: VibeConfigSchema,

  /** Raw YAML content */
  raw_yaml: z.string(),
});

export type VibeConfigCard = z.infer<typeof VibeConfigCardSchema>;

/**
 * Schema for board vibe status - columns and readiness.
 */
export const BoardVibeStatusSchema = z.object({
  /** Board ID */
  board_id: z.string(),

  /** Board name */
  board_name: z.string(),

  /** Whether board has a valid config card */
  has_config: z.boolean(),

  /** Config if present */
  config: VibeConfigSchema.optional(),

  /** Column status */
  columns: z.object({
    /** Existing columns on the board */
    existing: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        is_vibe_column: z.boolean(),
        vibe_role: z.enum(['Maybe', 'Accepted', 'InProgress', 'Blocked']).optional(),
      }),
    ),

    /** Which standard vibe columns are missing */
    missing: z.array(z.enum(['Maybe', 'Accepted', 'InProgress', 'Blocked'])),
  }),

  /** Cards ready for AI work (in Accepted column with AI tags) */
  ready_cards: z.number(),

  /** Whether board is fully set up for vibe coding */
  is_ready: z.boolean(),
});

export type BoardVibeStatus = z.infer<typeof BoardVibeStatusSchema>;

/**
 * Schema for vibe session state.
 */
export const VibeSessionSchema = z.object({
  /** Board ID being worked on */
  board_id: z.string(),

  /** Board name */
  board_name: z.string(),

  /** Parsed config */
  config: VibeConfigSchema,

  /** Local repository path */
  repo_path: z.string(),

  /** Current card being worked on (if any) */
  current_card: z
    .object({
      number: z.number(),
      title: z.string(),
      mode: z.enum(['ai-code', 'ai-plan']),
      branch: z.string().optional(),
      started_at: z.string().datetime(),
    })
    .optional(),

  /** Session started timestamp */
  started_at: z.string().datetime(),

  /** Cards completed this session */
  cards_completed: z.number(),
});

export type VibeSession = z.infer<typeof VibeSessionSchema>;

/**
 * Config card template YAML content.
 */
export const CONFIG_CARD_TEMPLATE = `# Fizzy Do Vibe Coding Configuration
# This card configures AI-assisted development for this board.
# 
# REQUIRED: Update the repository URL to match your project.
# Only ONE #ai-config card is allowed per board.

repository: https://github.com/your-org/your-repo
default_branch: main
branch_pattern: ai/card-{number}-{slug}

# Optional settings
pr_template: default  # Options: minimal, default, detailed
auto_assign_pr: true  # Assign PR to card assignees
`;

/**
 * Config card title.
 */
export const CONFIG_CARD_TITLE = 'AI Configuration';

/**
 * Config card tag.
 */
export const CONFIG_CARD_TAG = 'ai-config';
