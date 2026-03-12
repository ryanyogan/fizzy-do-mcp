import { z } from 'zod';
import { UserSchema } from './common.js';

/**
 * Schema for board objects returned by the Fizzy API.
 */
export const BoardSchema = z.object({
  id: z.string(),
  name: z.string(),
  all_access: z.boolean(),
  created_at: z.string().datetime({ offset: true }),
  auto_postpone_period_in_days: z.number().nullable(),
  url: z.string().url(),
  creator: UserSchema,
  public_url: z.string().url().optional(),
});

export type Board = z.infer<typeof BoardSchema>;

/**
 * Schema for the list of boards response.
 */
export const BoardListSchema = z.array(BoardSchema);

export type BoardList = z.infer<typeof BoardListSchema>;

/**
 * Schema for board summary (embedded in cards, etc.).
 */
export const BoardSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  all_access: z.boolean(),
  created_at: z.string().datetime({ offset: true }),
  auto_postpone_period_in_days: z.number().nullable(),
  url: z.string().url(),
  creator: UserSchema,
});

export type BoardSummary = z.infer<typeof BoardSummarySchema>;

/**
 * Schema for creating a new board.
 */
export const CreateBoardInputSchema = z.object({
  name: z.string().min(1, 'Board name is required'),
  all_access: z.boolean().optional().default(true),
  auto_postpone_period_in_days: z.number().positive().optional(),
  public_description: z.string().optional(),
});

export type CreateBoardInput = z.infer<typeof CreateBoardInputSchema>;

/**
 * Schema for updating a board.
 */
export const UpdateBoardInputSchema = z.object({
  name: z.string().min(1).optional(),
  all_access: z.boolean().optional(),
  auto_postpone_period_in_days: z.number().positive().optional(),
  public_description: z.string().optional(),
  user_ids: z.array(z.string()).optional(),
});

export type UpdateBoardInput = z.infer<typeof UpdateBoardInputSchema>;
