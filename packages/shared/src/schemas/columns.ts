import { z } from 'zod';
import { ColumnColorSchema, ColumnColorValueSchema } from './common.js';

/**
 * Schema for column objects returned by the Fizzy API.
 */
export const ColumnSchema = z.object({
  id: z.string(),
  name: z.string(),
  color: ColumnColorSchema,
  created_at: z.string().datetime({ offset: true }),
});

export type Column = z.infer<typeof ColumnSchema>;

/**
 * Schema for the list of columns response.
 */
export const ColumnListSchema = z.array(ColumnSchema);

export type ColumnList = z.infer<typeof ColumnListSchema>;

/**
 * Schema for creating a new column.
 */
export const CreateColumnInputSchema = z.object({
  name: z.string().min(1, 'Column name is required'),
  color: ColumnColorValueSchema.optional(),
});

export type CreateColumnInput = z.infer<typeof CreateColumnInputSchema>;

/**
 * Schema for updating a column.
 */
export const UpdateColumnInputSchema = z.object({
  name: z.string().min(1).optional(),
  color: ColumnColorValueSchema.optional(),
});

export type UpdateColumnInput = z.infer<typeof UpdateColumnInputSchema>;
