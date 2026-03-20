import { z } from 'zod';

/**
 * Work trigger sources - what caused the work item to be created.
 */
export const WorkTriggerSchema = z.enum([
  'card_triaged', // Card moved to a trigger column
  'card_tagged', // AI tag added to card
  'card_assigned', // Card assigned to AI user
  'manual', // Manually queued via MCP tool
]);

export type WorkTrigger = z.infer<typeof WorkTriggerSchema>;

/**
 * Work item status in the queue.
 */
export const WorkStatusSchema = z.enum([
  'pending', // Waiting to be claimed
  'claimed', // Claimed by an agent
  'completed', // Successfully completed
  'failed', // Failed with error
  'abandoned', // Agent abandoned the work
]);

export type WorkStatus = z.infer<typeof WorkStatusSchema>;

/**
 * AI work modes - determines what the agent should do.
 */
export const WorkModeSchema = z.enum([
  'code', // Write code, create branch, submit PR
  'plan', // Break down into steps, add notes (no code)
]);

export type WorkMode = z.infer<typeof WorkModeSchema>;

/**
 * Schema for a pending work item stored in KV.
 *
 * Key format: `{account_slug}:{card_number}`
 * Example: `/6099243:42`
 */
export const PendingWorkSchema = z.object({
  /** Unique work item ID */
  id: z.string(),

  /** Account slug (e.g., "/6099243") */
  account_slug: z.string(),

  /** Card number */
  card_number: z.number(),

  /** Card title at time of trigger */
  card_title: z.string(),

  /** Board ID the card belongs to */
  board_id: z.string(),

  /** Board name for context */
  board_name: z.string(),

  /** Work mode (code or plan) */
  mode: WorkModeSchema,

  /** Current status */
  status: WorkStatusSchema,

  /** What triggered this work */
  trigger: WorkTriggerSchema,

  /** Column name the card is in (for context) */
  column_name: z.string().nullable(),

  /** ISO timestamp when work was created */
  created_at: z.string().datetime(),

  /** ISO timestamp when work was claimed (if any) */
  claimed_at: z.string().datetime().nullable(),

  /** Agent ID that claimed the work (if any) */
  claimed_by: z.string().nullable(),

  /** ISO timestamp when work was completed (if any) */
  completed_at: z.string().datetime().nullable(),

  /** Error message if failed */
  error: z.string().nullable(),

  /** Additional metadata from the webhook */
  metadata: z
    .object({
      /** User who triggered the webhook action */
      triggered_by_user: z.string().optional(),
      /** Webhook event ID for tracing */
      webhook_event_id: z.string().optional(),
    })
    .optional(),
});

export type PendingWork = z.infer<typeof PendingWorkSchema>;

/**
 * Schema for creating a new pending work item (input).
 */
export const CreatePendingWorkSchema = PendingWorkSchema.pick({
  account_slug: true,
  card_number: true,
  card_title: true,
  board_id: true,
  board_name: true,
  mode: true,
  trigger: true,
  column_name: true,
  metadata: true,
});

export type CreatePendingWork = z.infer<typeof CreatePendingWorkSchema>;

/**
 * Schema for listing pending work (filters).
 */
export const ListPendingWorkFilterSchema = z.object({
  /** Filter by status (default: pending) */
  status: WorkStatusSchema.optional(),

  /** Filter by board ID */
  board_id: z.string().optional(),

  /** Filter by work mode */
  mode: WorkModeSchema.optional(),

  /** Maximum number of items to return */
  limit: z.number().min(1).max(100).default(10),
});

export type ListPendingWorkFilter = z.infer<typeof ListPendingWorkFilterSchema>;

/**
 * Schema for claiming work.
 */
export const ClaimWorkInputSchema = z.object({
  /** Work item ID to claim */
  work_id: z.string(),

  /** Agent identifier claiming the work */
  agent_id: z.string(),
});

export type ClaimWorkInput = z.infer<typeof ClaimWorkInputSchema>;

/**
 * Schema for completing work.
 */
export const CompleteWorkInputSchema = z.object({
  /** Work item ID */
  work_id: z.string(),

  /** Whether work completed successfully */
  success: z.boolean(),

  /** Error message if failed */
  error: z.string().optional(),
});

export type CompleteWorkInput = z.infer<typeof CompleteWorkInputSchema>;

/**
 * Generate a KV key for a pending work item.
 *
 * @param accountSlug - Account slug (e.g., "/6099243")
 * @param cardNumber - Card number
 * @returns KV key string
 */
export function pendingWorkKey(accountSlug: string, cardNumber: number): string {
  return `${accountSlug}:${cardNumber}`;
}

/**
 * Generate a unique work item ID.
 *
 * @param accountSlug - Account slug
 * @param cardNumber - Card number
 * @param timestamp - Creation timestamp
 * @returns Unique work item ID
 */
export function generateWorkId(accountSlug: string, cardNumber: number, timestamp: Date): string {
  const ts = timestamp.getTime().toString(36);
  const slug = accountSlug.replace('/', '');
  return `${slug}-${cardNumber}-${ts}`;
}

/**
 * Columns that trigger AI work when cards are moved to them.
 *
 * These are Fizzy's default column names that we recognize as triggers.
 * Case-insensitive matching is used.
 */
export const WORK_TRIGGER_COLUMNS = ['accepted', 'to do', 'todo', 'ready'] as const;

/**
 * Tags that indicate AI work mode.
 */
export const AI_WORK_TAGS = {
  code: ['ai-code', 'ai', 'code'],
  plan: ['ai-plan', 'plan'],
} as const;

/**
 * Detect work mode from card tags.
 *
 * @param tags - Array of tag names (without #)
 * @returns Work mode or null if no AI tags found
 */
export function detectWorkMode(tags: string[]): WorkMode | null {
  const normalizedTags = tags.map((t) => t.toLowerCase());

  // Check for plan tags first (more specific)
  if (AI_WORK_TAGS.plan.some((t) => normalizedTags.includes(t))) {
    return 'plan';
  }

  // Check for code tags
  if (AI_WORK_TAGS.code.some((t) => normalizedTags.includes(t))) {
    return 'code';
  }

  return null;
}

/**
 * Check if a column name is a work trigger column.
 *
 * @param columnName - Column name to check
 * @returns True if this column triggers AI work
 */
export function isWorkTriggerColumn(columnName: string): boolean {
  const normalized = columnName.toLowerCase().trim();
  return WORK_TRIGGER_COLUMNS.includes(normalized as (typeof WORK_TRIGGER_COLUMNS)[number]);
}
