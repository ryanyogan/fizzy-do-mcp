import { z } from 'zod';
import { UserSchema } from './common.js';

/**
 * Schema for comment body with both plain text and HTML.
 */
export const CommentBodySchema = z.object({
  plain_text: z.string(),
  html: z.string(),
});

export type CommentBody = z.infer<typeof CommentBodySchema>;

/**
 * Schema for card reference in comments.
 */
export const CommentCardRefSchema = z.object({
  id: z.string(),
  url: z.string().url(),
});

export type CommentCardRef = z.infer<typeof CommentCardRefSchema>;

/**
 * Schema for comment objects returned by the Fizzy API.
 */
export const CommentSchema = z.object({
  id: z.string(),
  created_at: z.string().datetime({ offset: true }),
  updated_at: z.string().datetime({ offset: true }),
  body: CommentBodySchema,
  creator: UserSchema,
  card: CommentCardRefSchema,
  reactions_url: z.string().url(),
  url: z.string().url(),
});

export type Comment = z.infer<typeof CommentSchema>;

/**
 * Schema for the list of comments response.
 */
export const CommentListSchema = z.array(CommentSchema);

export type CommentList = z.infer<typeof CommentListSchema>;

/**
 * Schema for creating a new comment.
 */
export const CreateCommentInputSchema = z.object({
  body: z.string().min(1, 'Comment body is required'),
  created_at: z.string().datetime({ offset: true }).optional(),
});

export type CreateCommentInput = z.infer<typeof CreateCommentInputSchema>;

/**
 * Schema for updating a comment.
 */
export const UpdateCommentInputSchema = z.object({
  body: z.string().min(1, 'Comment body is required'),
});

export type UpdateCommentInput = z.infer<typeof UpdateCommentInputSchema>;
