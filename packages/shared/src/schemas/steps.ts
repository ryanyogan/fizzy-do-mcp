import { z } from 'zod';
import { StepSchema } from './common.js';

/**
 * Schema for creating a new step.
 */
export const CreateStepInputSchema = z.object({
  content: z.string().min(1, 'Step content is required'),
  completed: z.boolean().optional().default(false),
});

export type CreateStepInput = z.infer<typeof CreateStepInputSchema>;

/**
 * Schema for updating a step.
 */
export const UpdateStepInputSchema = z.object({
  content: z.string().min(1).optional(),
  completed: z.boolean().optional(),
});

export type UpdateStepInput = z.infer<typeof UpdateStepInputSchema>;

// Re-export Step type from common for convenience
export { StepSchema };
export type { Step } from './common.js';
