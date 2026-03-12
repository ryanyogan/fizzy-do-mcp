import { z } from 'zod';

/**
 * Schema for tag objects returned by the Fizzy API.
 */
export const TagSchema = z.object({
  id: z.string(),
  title: z.string(),
  created_at: z.string().datetime({ offset: true }),
  url: z.string().url(),
});

export type Tag = z.infer<typeof TagSchema>;

/**
 * Schema for the list of tags response.
 */
export const TagListSchema = z.array(TagSchema);

export type TagList = z.infer<typeof TagListSchema>;
