/**
 * Vibe Coding WebSocket protocol types and utilities.
 *
 * This module defines the message types for communication between:
 * - Local MCP server running in `--vibe` mode (WebSocket client)
 * - Cloudflare Worker that receives webhooks (WebSocket server)
 *
 * @module @fizzy-mcp/shared/vibe
 */

export {
  // Card work item
  CardWorkItemSchema,
  type CardWorkItem,
  // Server → Client messages
  ConnectedMessageSchema,
  WorkAssignedMessageSchema,
  WorkCancelledMessageSchema,
  QueueStatusMessageSchema,
  ErrorMessageSchema,
  PingMessageSchema,
  ServerMessageSchema,
  type ConnectedMessage,
  type WorkAssignedMessage,
  type WorkCancelledMessage,
  type QueueStatusMessage,
  type ErrorMessage,
  type PingMessage,
  type ServerMessage,
  // Client → Server messages
  RegisterMessageSchema,
  ReadyMessageSchema,
  WorkStartedMessageSchema,
  WorkProgressMessageSchema,
  WorkCompletedMessageSchema,
  WorkFailedMessageSchema,
  PongMessageSchema,
  ClientMessageSchema,
  type RegisterMessage,
  type ReadyMessage,
  type WorkStartedMessage,
  type WorkProgressMessage,
  type WorkCompletedMessage,
  type WorkFailedMessage,
  type PongMessage,
  type ClientMessage,
  // Error codes
  ERROR_CODES,
  type ErrorCode,
  // Helper functions
  isServerMessage,
  isClientMessage,
  parseServerMessage,
  parseClientMessage,
  serializeMessage,
  serverMessage,
  clientMessage,
} from './protocol.js';
