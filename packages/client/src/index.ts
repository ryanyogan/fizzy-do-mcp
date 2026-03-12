/**
 * @fizzy-mcp/client
 *
 * Type-safe HTTP client for the Fizzy API.
 *
 * @example
 * ```typescript
 * import { FizzyClient } from '@fizzy-mcp/client';
 *
 * const client = new FizzyClient({
 *   accessToken: process.env.FIZZY_ACCESS_TOKEN!,
 *   accountSlug: '/897362094',
 * });
 *
 * // List boards
 * const boards = await client.boards.list();
 * if (boards.ok) {
 *   console.log('Boards:', boards.value);
 * }
 *
 * // Create a card
 * const card = await client.cards.create('board-id', {
 *   title: 'My new card',
 *   description: '<p>Description here</p>',
 * });
 * ```
 *
 * @packageDocumentation
 */

// Main client
export { FizzyClient, type FizzyClientConfig } from './client.js';

// HTTP layer (for custom implementations)
export type {
  HttpClient,
  HttpClientConfig,
  HttpRequestConfig,
  HttpResponse,
} from './http/types.js';
export { FetchHttpClient } from './http/fetch-client.js';
export { withRetry, DEFAULT_RETRY_CONFIG, type RetryConfig } from './http/retry.js';

// Endpoint classes (for extension)
export {
  BaseEndpoint,
  GlobalEndpoint,
  type EndpointContext,
} from './endpoints/base.js';
export { IdentityEndpoint, AccountEndpoint } from './endpoints/identity.js';
export { BoardsEndpoint } from './endpoints/boards.js';
export { ColumnsEndpoint } from './endpoints/columns.js';
export { CardsEndpoint } from './endpoints/cards.js';
export { CommentsEndpoint } from './endpoints/comments.js';
export { TagsEndpoint } from './endpoints/tags.js';
export { UsersEndpoint } from './endpoints/users.js';
export { PinsEndpoint } from './endpoints/pins.js';

// Re-export commonly used types from shared
export type {
  // Result type
  Result,
  // Error types
  FizzyError,
  FizzyApiError,
  FizzyAuthError,
  FizzyNotFoundError,
  FizzyValidationError,
  FizzyNetworkError,
  FizzyConfigError,
  FizzyRateLimitError,
  // API types
  User,
  Account,
  IdentityResponse,
  AccountSettings,
  Board,
  BoardList,
  BoardSummary,
  Column,
  ColumnList,
  Card,
  CardSummary,
  CardList,
  Comment,
  CommentList,
  Tag,
  TagList,
  Step,
  // Input types
  CreateBoardInput,
  UpdateBoardInput,
  CreateColumnInput,
  UpdateColumnInput,
  CreateCardInput,
  UpdateCardInput,
  ListCardsParams,
  CreateCommentInput,
  UpdateCommentInput,
} from '@fizzy-mcp/shared';
