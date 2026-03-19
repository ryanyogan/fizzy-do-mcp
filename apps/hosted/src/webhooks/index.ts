/**
 * Webhooks Module
 *
 * Handles incoming webhooks from Fizzy, filters for AI-tagged cards,
 * and dispatches work to connected sessions.
 */

// Routes
export { webhookRoutes, verifyWebhookSignature } from './handler';

// Filtering utilities
export {
  isAiTaggedCard,
  getAiWorkMode,
  shouldProcessCard,
  isAcceptedColumn,
  hasAiStartCommand,
  type CardData,
} from './filter';

// Dispatcher
export { dispatchWork, cancelWork, getQueueStatus, type DispatchResult } from './dispatcher';
