/**
 * @fizzy-do-mcp/shared
 *
 * Shared types, schemas, and utilities for the Fizzy MCP server.
 *
 * @packageDocumentation
 */

// Result type for explicit error handling
export {
  Ok,
  Err,
  isOk,
  isErr,
  unwrap,
  unwrapOr,
  map,
  mapErr,
  andThen,
  fromPromise,
  fromTry,
  type Result,
} from './result.js';

// Error classes
export {
  FizzyError,
  FizzyApiError,
  FizzyAuthError,
  FizzyForbiddenError,
  FizzyNotFoundError,
  FizzyValidationError,
  FizzyNetworkError,
  FizzyConfigError,
  FizzyRateLimitError,
  toFizzyError,
  type ValidationIssue,
} from './errors.js';

// Configuration types
export {
  FizzyConfigSchema,
  StoredConfigSchema,
  DEFAULT_CONFIG,
  ENV_VARS,
  CONFIG_PATHS,
  OLD_CONFIG_PATHS,
  HOSTED_URLS,
  FIZZY_TOKEN_URL,
  type FizzyConfig,
  type StoredConfig,
} from './config.js';

// All Zod schemas and types
export * from './schemas/index.js';

// Markdown utilities for rich text fields
export { markdownToHtml, isHtml, toRichText } from './markdown.js';

// Vibe Coding WebSocket protocol
export * from './vibe/index.js';
