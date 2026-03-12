import { z } from 'zod';
import { UserSchema, StepSchema } from './common.js';
import { BoardSummarySchema } from './boards.js';
import { ColumnSchema } from './columns.js';

/**
 * Card status values.
 */
export const CardStatusSchema = z.enum(['drafted', 'published']);
export type CardStatus = z.infer<typeof CardStatusSchema>;

/**
 * Schema for card objects returned by the Fizzy API (list view).
 */
export const CardSummarySchema = z.object({
  id: z.string(),
  number: z.number(),
  title: z.string(),
  status: CardStatusSchema,
  description: z.string().nullable(),
  description_html: z.string().nullable(),
  image_url: z.string().url().nullable(),
  has_attachments: z.boolean(),
  tags: z.array(z.string()),
  golden: z.boolean(),
  last_active_at: z.string().datetime({ offset: true }),
  created_at: z.string().datetime({ offset: true }),
  url: z.string().url(),
  board: BoardSummarySchema,
  creator: UserSchema,
  assignees: z.array(UserSchema).optional(),
  comments_url: z.string().url(),
  reactions_url: z.string().url().optional(),
});

export type CardSummary = z.infer<typeof CardSummarySchema>;

/**
 * Schema for card objects returned by the Fizzy API (detail view).
 */
export const CardSchema = CardSummarySchema.extend({
  closed: z.boolean().optional(),
  column: ColumnSchema.optional(),
  steps: z.array(StepSchema).optional(),
});

export type Card = z.infer<typeof CardSchema>;

/**
 * Schema for the list of cards response.
 */
export const CardListSchema = z.array(CardSummarySchema);

export type CardList = z.infer<typeof CardListSchema>;

/**
 * Indexed by values for filtering cards.
 */
export const CardIndexedBySchema = z.enum([
  'all',
  'closed',
  'not_now',
  'stalled',
  'postponing_soon',
  'golden',
]);

export type CardIndexedBy = z.infer<typeof CardIndexedBySchema>;

/**
 * Sort by values for listing cards.
 */
export const CardSortedBySchema = z.enum(['latest', 'newest', 'oldest']);

export type CardSortedBy = z.infer<typeof CardSortedBySchema>;

/**
 * Date filter values for cards.
 */
export const CardDateFilterSchema = z.enum([
  'today',
  'yesterday',
  'thisweek',
  'lastweek',
  'thismonth',
  'lastmonth',
  'thisyear',
  'lastyear',
]);

export type CardDateFilter = z.infer<typeof CardDateFilterSchema>;

/**
 * Schema for listing cards with filters.
 */
export const ListCardsParamsSchema = z.object({
  board_ids: z.array(z.string()).optional(),
  tag_ids: z.array(z.string()).optional(),
  assignee_ids: z.array(z.string()).optional(),
  creator_ids: z.array(z.string()).optional(),
  closer_ids: z.array(z.string()).optional(),
  card_ids: z.array(z.string()).optional(),
  indexed_by: CardIndexedBySchema.optional(),
  sorted_by: CardSortedBySchema.optional(),
  assignment_status: z.enum(['unassigned']).optional(),
  creation: CardDateFilterSchema.optional(),
  closure: CardDateFilterSchema.optional(),
  terms: z.array(z.string()).optional(),
});

export type ListCardsParams = z.infer<typeof ListCardsParamsSchema>;

/**
 * Schema for creating a new card.
 */
export const CreateCardInputSchema = z.object({
  title: z.string().min(1, 'Card title is required'),
  description: z.string().optional(),
  status: CardStatusSchema.optional().default('published'),
  tag_ids: z.array(z.string()).optional(),
  created_at: z.string().datetime({ offset: true }).optional(),
  last_active_at: z.string().datetime({ offset: true }).optional(),
});

export type CreateCardInput = z.infer<typeof CreateCardInputSchema>;

/**
 * Schema for updating a card.
 */
export const UpdateCardInputSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  status: CardStatusSchema.optional(),
  tag_ids: z.array(z.string()).optional(),
  last_active_at: z.string().datetime({ offset: true }).optional(),
});

export type UpdateCardInput = z.infer<typeof UpdateCardInputSchema>;

/**
 * Schema for triaging a card to a column.
 */
export const TriageCardInputSchema = z.object({
  column_id: z.string().min(1, 'Column ID is required'),
});

export type TriageCardInput = z.infer<typeof TriageCardInputSchema>;

/**
 * Schema for assigning a user to a card.
 */
export const AssignCardInputSchema = z.object({
  assignee_id: z.string().min(1, 'Assignee ID is required'),
});

export type AssignCardInput = z.infer<typeof AssignCardInputSchema>;

/**
 * Schema for tagging a card.
 */
export const TagCardInputSchema = z.object({
  tag_title: z.string().min(1, 'Tag title is required'),
});

export type TagCardInput = z.infer<typeof TagCardInputSchema>;
