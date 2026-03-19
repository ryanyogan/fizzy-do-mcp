import {
  type Result,
  type FizzyError,
  StepSchema,
  type Step,
  type CreateStepInput,
  type UpdateStepInput,
} from '@fizzy-do-mcp/shared';
import { z } from 'zod';
import { BaseEndpoint } from './base.js';

/**
 * Schema for step list response.
 */
const StepListSchema = z.array(StepSchema);

/**
 * Endpoint for step (checklist item) operations on cards.
 *
 * Steps are checklist items that can be added to cards to track
 * sub-tasks or progress indicators.
 */
export class StepsEndpoint extends BaseEndpoint {
  /**
   * Lists all steps on a card.
   *
   * @param cardNumber - The card number
   *
   * @example
   * ```typescript
   * const result = await client.steps.list(123);
   * if (result.ok) {
   *   for (const step of result.value) {
   *     const status = step.completed ? '✓' : '○';
   *     console.log(`${status} ${step.content}`);
   *   }
   * }
   * ```
   */
  async list(cardNumber: number): Promise<Result<Step[], FizzyError>> {
    return this.get(`/cards/${cardNumber}/steps`, StepListSchema);
  }

  /**
   * Creates a new step on a card.
   *
   * @param cardNumber - The card number
   * @param input - Step creation parameters
   *
   * @example
   * ```typescript
   * const result = await client.steps.create(123, {
   *   content: 'Review the PR',
   *   completed: false,
   * });
   * if (result.ok) {
   *   console.log('Created step:', result.value.id);
   * }
   * ```
   */
  async create(cardNumber: number, input: CreateStepInput): Promise<Result<Step, FizzyError>> {
    return this.post(`/cards/${cardNumber}/steps`, StepSchema, { step: input });
  }

  /**
   * Updates a step.
   *
   * @param cardNumber - The card number
   * @param stepId - The step's unique identifier
   * @param input - Step update parameters
   *
   * @example
   * ```typescript
   * const result = await client.steps.update(123, 'step-456', {
   *   completed: true,
   * });
   * ```
   */
  async update(
    cardNumber: number,
    stepId: string,
    input: UpdateStepInput,
  ): Promise<Result<void, FizzyError>> {
    return this.putNoContent(`/cards/${cardNumber}/steps/${stepId}`, { step: input });
  }

  /**
   * Deletes a step.
   *
   * @param cardNumber - The card number
   * @param stepId - The step's unique identifier
   *
   * @example
   * ```typescript
   * const result = await client.steps.deleteStep(123, 'step-456');
   * if (result.ok) {
   *   console.log('Step deleted');
   * }
   * ```
   */
  async deleteStep(cardNumber: number, stepId: string): Promise<Result<void, FizzyError>> {
    return this.delete(`/cards/${cardNumber}/steps/${stepId}`);
  }

  /**
   * Toggles a step's completion status.
   *
   * @param cardNumber - The card number
   * @param stepId - The step's unique identifier
   *
   * @example
   * ```typescript
   * const result = await client.steps.toggle(123, 'step-456');
   * if (result.ok) {
   *   console.log('Step toggled');
   * }
   * ```
   */
  async toggle(cardNumber: number, stepId: string): Promise<Result<void, FizzyError>> {
    return this.postNoContent(`/cards/${cardNumber}/steps/${stepId}/toggle`);
  }
}
