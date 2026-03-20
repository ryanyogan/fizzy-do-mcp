/**
 * Webhooks Module
 *
 * Handles incoming webhooks from Fizzy, filters for AI-tagged cards,
 * and stores pending work in KV for retrieval by AI agents.
 */

// Routes
export { webhookRoutes, verifyWebhookSignature } from './handler';

// Dispatcher
export { dispatchWork, cancelWork, type DispatchResult, type WebhookCardData } from './dispatcher';
