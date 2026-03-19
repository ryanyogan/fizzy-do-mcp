import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { FizzyClient } from '@fizzy-do-mcp/client';
import { wrapToolOperation } from '../utils.js';

/**
 * Registers step (checklist) related tools with the MCP server.
 *
 * Steps are checklist items that can be added to cards to track
 * sub-tasks or progress indicators.
 */
export function registerStepTools(server: McpServer, client: FizzyClient): void {
  // List Steps
  server.tool(
    'fizzy_list_steps',
    'List all steps (checklist items) on a card.',
    {
      card_number: z.number().describe('The card number'),
    },
    async ({ card_number }) => {
      return wrapToolOperation(
        () => client.steps.list(card_number),
        (steps) => {
          const completed = steps.filter((s) => s.completed).length;
          return `Found ${steps.length} step(s) (${completed} completed)`;
        },
      );
    },
  );

  // Create Step
  server.tool(
    'fizzy_create_step',
    'Create a new step (checklist item) on a card.',
    {
      card_number: z.number().describe('The card number'),
      content: z.string().min(1).describe('The step content/description'),
      completed: z.boolean().optional().default(false).describe('Whether the step is completed'),
    },
    async ({ card_number, content, completed }) => {
      return wrapToolOperation(
        () => client.steps.create(card_number, { content, completed }),
        () => `Created step "${content}" on card #${card_number}`,
      );
    },
  );

  // Update Step
  server.tool(
    'fizzy_update_step',
    'Update a step on a card.',
    {
      card_number: z.number().describe('The card number'),
      step_id: z.string().describe('The step ID'),
      content: z.string().min(1).optional().describe('New content for the step'),
      completed: z.boolean().optional().describe('Whether the step is completed'),
    },
    async ({ card_number, step_id, content, completed }) => {
      return wrapToolOperation(
        () => client.steps.update(card_number, step_id, { content, completed }),
        'Step updated',
      );
    },
  );

  // Toggle Step
  server.tool(
    'fizzy_toggle_step',
    'Toggle a step between completed and not completed.',
    {
      card_number: z.number().describe('The card number'),
      step_id: z.string().describe('The step ID'),
    },
    async ({ card_number, step_id }) => {
      return wrapToolOperation(() => client.steps.toggle(card_number, step_id), 'Step toggled');
    },
  );

  // Delete Step
  server.tool(
    'fizzy_delete_step',
    'Delete a step from a card.',
    {
      card_number: z.number().describe('The card number'),
      step_id: z.string().describe('The step ID'),
    },
    async ({ card_number, step_id }) => {
      return wrapToolOperation(() => client.steps.deleteStep(card_number, step_id), 'Step deleted');
    },
  );
}
