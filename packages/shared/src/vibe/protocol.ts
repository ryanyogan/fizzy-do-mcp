import { z } from 'zod';
import { VibeConfigSchema } from '../schemas/vibe-config.js';

// ============================================================================
// Card Work Item
// ============================================================================

/**
 * Schema for minimal card information needed for AI work.
 *
 * This is a subset of the full Card type, containing only the fields
 * necessary for the AI agent to understand and complete the work.
 */
export const CardWorkItemSchema = z.object({
  /** Card number (unique within the account) */
  number: z.number(),

  /** Card title - the main task description */
  title: z.string(),

  /** Card description - additional context and requirements */
  description: z.string().nullable(),

  /** Tags applied to the card (e.g., 'ai-code', 'ai-plan') */
  tags: z.array(z.string()),

  /** Steps/checklist items on the card */
  steps: z.array(
    z.object({
      id: z.string(),
      content: z.string(),
      completed: z.boolean(),
    }),
  ),

  /** Board ID this card belongs to */
  board_id: z.string(),

  /** Board name for context */
  board_name: z.string(),
});

export type CardWorkItem = z.infer<typeof CardWorkItemSchema>;

// ============================================================================
// Server → Client Messages
// ============================================================================

/**
 * Sent when WebSocket connection is established and authenticated.
 */
export const ConnectedMessageSchema = z.object({
  type: z.literal('connected'),
  /** Unique session identifier for this connection */
  session_id: z.string(),
});

/**
 * Sent when work is assigned to this client.
 * The client should start working on the card immediately.
 */
export const WorkAssignedMessageSchema = z.object({
  type: z.literal('work_assigned'),
  /** The card to work on */
  card: CardWorkItemSchema,
  /** The AI work mode (determines what actions to take) */
  mode: z.enum(['ai-code', 'ai-plan']),
  /** Board's vibe configuration */
  config: VibeConfigSchema,
});

/**
 * Sent when previously assigned work is cancelled.
 * The client should stop work and clean up (e.g., delete branch).
 */
export const WorkCancelledMessageSchema = z.object({
  type: z.literal('work_cancelled'),
  /** Card number that was cancelled */
  card_number: z.number(),
  /** Reason for cancellation (e.g., 'card_closed', 'card_postponed') */
  reason: z.string(),
});

/**
 * Sent periodically to inform client of queue status.
 */
export const QueueStatusMessageSchema = z.object({
  type: z.literal('queue_status'),
  /** Number of cards waiting in the queue for this board */
  cards_waiting: z.number(),
  /** Client's position in queue (if waiting) */
  position: z.number().optional(),
});

/**
 * Sent when an error occurs on the server side.
 */
export const ErrorMessageSchema = z.object({
  type: z.literal('error'),
  /** Error code for programmatic handling */
  code: z.string(),
  /** Human-readable error message */
  message: z.string(),
});

/**
 * Ping message to keep connection alive.
 * Client should respond with 'pong'.
 */
export const PingMessageSchema = z.object({
  type: z.literal('ping'),
});

/**
 * Union schema for all server → client messages.
 */
export const ServerMessageSchema = z.discriminatedUnion('type', [
  ConnectedMessageSchema,
  WorkAssignedMessageSchema,
  WorkCancelledMessageSchema,
  QueueStatusMessageSchema,
  ErrorMessageSchema,
  PingMessageSchema,
]);

export type ConnectedMessage = z.infer<typeof ConnectedMessageSchema>;
export type WorkAssignedMessage = z.infer<typeof WorkAssignedMessageSchema>;
export type WorkCancelledMessage = z.infer<typeof WorkCancelledMessageSchema>;
export type QueueStatusMessage = z.infer<typeof QueueStatusMessageSchema>;
export type ErrorMessage = z.infer<typeof ErrorMessageSchema>;
export type PingMessage = z.infer<typeof PingMessageSchema>;
export type ServerMessage = z.infer<typeof ServerMessageSchema>;

// ============================================================================
// Client → Server Messages
// ============================================================================

/**
 * Sent immediately after WebSocket connection to authenticate and register.
 */
export const RegisterMessageSchema = z.object({
  type: z.literal('register'),
  /** Board ID to receive work for */
  board_id: z.string(),
  /** Fizzy API token for authentication */
  fizzy_token: z.string(),
  /** Local path to the git repository */
  repo_path: z.string(),
});

/**
 * Sent after registration to indicate client is ready for work.
 * Also sent after completing/failing work to request next assignment.
 */
export const ReadyMessageSchema = z.object({
  type: z.literal('ready'),
});

/**
 * Sent when client begins working on an assigned card.
 */
export const WorkStartedMessageSchema = z.object({
  type: z.literal('work_started'),
  /** Card number being worked on */
  card_number: z.number(),
  /** Git branch created for this work (if applicable) */
  branch: z.string().optional(),
});

/**
 * Sent periodically to report work progress.
 * Allows the server to update the card with status comments.
 */
export const WorkProgressMessageSchema = z.object({
  type: z.literal('work_progress'),
  /** Card number being worked on */
  card_number: z.number(),
  /** Short status description (e.g., 'analyzing', 'implementing', 'testing') */
  status: z.string(),
  /** Optional detailed progress information */
  details: z.string().optional(),
});

/**
 * Sent when work is successfully completed.
 */
export const WorkCompletedMessageSchema = z.object({
  type: z.literal('work_completed'),
  /** Card number that was completed */
  card_number: z.number(),
  /** URL of the created PR (for ai-code mode) */
  pr_url: z.string().optional(),
  /** Summary of what was accomplished */
  summary: z.string(),
});

/**
 * Sent when work fails and cannot be completed.
 */
export const WorkFailedMessageSchema = z.object({
  type: z.literal('work_failed'),
  /** Card number that failed */
  card_number: z.number(),
  /** Error message describing the failure */
  error: z.string(),
  /** Optional detailed error information (e.g., stack trace) */
  details: z.string().optional(),
});

/**
 * Response to server's ping message.
 */
export const PongMessageSchema = z.object({
  type: z.literal('pong'),
});

/**
 * Union schema for all client → server messages.
 */
export const ClientMessageSchema = z.discriminatedUnion('type', [
  RegisterMessageSchema,
  ReadyMessageSchema,
  WorkStartedMessageSchema,
  WorkProgressMessageSchema,
  WorkCompletedMessageSchema,
  WorkFailedMessageSchema,
  PongMessageSchema,
]);

export type RegisterMessage = z.infer<typeof RegisterMessageSchema>;
export type ReadyMessage = z.infer<typeof ReadyMessageSchema>;
export type WorkStartedMessage = z.infer<typeof WorkStartedMessageSchema>;
export type WorkProgressMessage = z.infer<typeof WorkProgressMessageSchema>;
export type WorkCompletedMessage = z.infer<typeof WorkCompletedMessageSchema>;
export type WorkFailedMessage = z.infer<typeof WorkFailedMessageSchema>;
export type PongMessage = z.infer<typeof PongMessageSchema>;
export type ClientMessage = z.infer<typeof ClientMessageSchema>;

// ============================================================================
// Error Codes
// ============================================================================

/**
 * Standard error codes for the 'error' message type.
 */
export const ERROR_CODES = {
  /** Authentication failed (invalid token) */
  AUTH_FAILED: 'auth_failed',
  /** Board not found or not accessible */
  BOARD_NOT_FOUND: 'board_not_found',
  /** Board is not configured for vibe coding */
  BOARD_NOT_CONFIGURED: 'board_not_configured',
  /** Another client is already connected for this board */
  ALREADY_CONNECTED: 'already_connected',
  /** Invalid message format */
  INVALID_MESSAGE: 'invalid_message',
  /** Work assignment failed */
  WORK_ASSIGNMENT_FAILED: 'work_assignment_failed',
  /** Internal server error */
  INTERNAL_ERROR: 'internal_error',
  /** Rate limited */
  RATE_LIMITED: 'rate_limited',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Type guard to check if a message is a server message.
 *
 * @param msg - Unknown value to check
 * @returns True if msg is a valid ServerMessage
 */
export function isServerMessage(msg: unknown): msg is ServerMessage {
  return ServerMessageSchema.safeParse(msg).success;
}

/**
 * Type guard to check if a message is a client message.
 *
 * @param msg - Unknown value to check
 * @returns True if msg is a valid ClientMessage
 */
export function isClientMessage(msg: unknown): msg is ClientMessage {
  return ClientMessageSchema.safeParse(msg).success;
}

/**
 * Parse a JSON string as a server message.
 *
 * @param data - JSON string to parse
 * @returns Parsed ServerMessage or null if invalid
 */
export function parseServerMessage(data: string): ServerMessage | null {
  try {
    const json: unknown = JSON.parse(data);
    const result = ServerMessageSchema.safeParse(json);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

/**
 * Parse a JSON string as a client message.
 *
 * @param data - JSON string to parse
 * @returns Parsed ClientMessage or null if invalid
 */
export function parseClientMessage(data: string): ClientMessage | null {
  try {
    const json: unknown = JSON.parse(data);
    const result = ClientMessageSchema.safeParse(json);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

/**
 * Serialize a message to JSON string for sending over WebSocket.
 *
 * @param msg - Server or client message to serialize
 * @returns JSON string representation
 */
export function serializeMessage(msg: ServerMessage | ClientMessage): string {
  return JSON.stringify(msg);
}

/**
 * Create a typed server message (for type-safe message construction).
 *
 * @param msg - Server message to create
 * @returns The same message with proper typing
 */
export function serverMessage<T extends ServerMessage>(msg: T): T {
  return msg;
}

/**
 * Create a typed client message (for type-safe message construction).
 *
 * @param msg - Client message to create
 * @returns The same message with proper typing
 */
export function clientMessage<T extends ClientMessage>(msg: T): T {
  return msg;
}
