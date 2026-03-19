import { z } from 'zod';
import { UserSchema } from './common.js';

/**
 * Available reaction emojis.
 */
export const ReactionEmojiSchema = z.enum([
  'thumbs_up',
  'thumbs_down',
  'heart',
  'tada',
  'thinking',
  'eyes',
  'fire',
  'rocket',
  'check',
  'x',
]);

export type ReactionEmoji = z.infer<typeof ReactionEmojiSchema>;

/**
 * All available reaction emojis.
 */
export const REACTION_EMOJIS = ReactionEmojiSchema.options;

/**
 * Schema for a reaction object.
 */
export const ReactionSchema = z.object({
  id: z.string(),
  emoji: ReactionEmojiSchema,
  user: UserSchema,
  created_at: z.string(),
});

export type Reaction = z.infer<typeof ReactionSchema>;

/**
 * Schema for reaction list response.
 */
export const ReactionListSchema = z.array(ReactionSchema);

export type ReactionList = z.infer<typeof ReactionListSchema>;

/**
 * Schema for creating a reaction.
 */
export const CreateReactionInputSchema = z.object({
  emoji: ReactionEmojiSchema,
});

export type CreateReactionInput = z.infer<typeof CreateReactionInputSchema>;

/**
 * Schema for reaction summary (count by emoji).
 */
export const ReactionSummarySchema = z.record(ReactionEmojiSchema, z.number());

export type ReactionSummary = z.infer<typeof ReactionSummarySchema>;
