/**
 * Zod schemas and TypeScript types for the Fizzy API.
 *
 * All schemas are derived from the Fizzy API documentation:
 * https://github.com/basecamp/fizzy/blob/main/docs/API.md
 *
 * @module @fizzy-mcp/shared/schemas
 */

// Common types used across multiple schemas
export {
  UserSchema,
  ColumnColorSchema,
  StepSchema,
  ColumnColorValueSchema,
  COLUMN_COLORS,
  type User,
  type ColumnColor,
  type Step,
  type ColumnColorName,
  type ColumnColorValue,
} from './common.js';

// Identity and account schemas
export {
  AccountSchema,
  IdentityResponseSchema,
  AccountSettingsSchema,
  type Account,
  type IdentityResponse,
  type AccountSettings,
} from './identity.js';

// Board schemas
export {
  BoardSchema,
  BoardListSchema,
  BoardSummarySchema,
  CreateBoardInputSchema,
  UpdateBoardInputSchema,
  type Board,
  type BoardList,
  type BoardSummary,
  type CreateBoardInput,
  type UpdateBoardInput,
} from './boards.js';

// Column schemas
export {
  ColumnSchema,
  ColumnListSchema,
  CreateColumnInputSchema,
  UpdateColumnInputSchema,
  type Column,
  type ColumnList,
  type CreateColumnInput,
  type UpdateColumnInput,
} from './columns.js';

// Card schemas
export {
  CardStatusSchema,
  CardSummarySchema,
  CardSchema,
  CardListSchema,
  CardIndexedBySchema,
  CardSortedBySchema,
  CardDateFilterSchema,
  ListCardsParamsSchema,
  CreateCardInputSchema,
  UpdateCardInputSchema,
  TriageCardInputSchema,
  AssignCardInputSchema,
  TagCardInputSchema,
  type CardStatus,
  type CardSummary,
  type Card,
  type CardList,
  type CardIndexedBy,
  type CardSortedBy,
  type CardDateFilter,
  type ListCardsParams,
  type CreateCardInput,
  type UpdateCardInput,
  type TriageCardInput,
  type AssignCardInput,
  type TagCardInput,
} from './cards.js';

// Comment schemas
export {
  CommentBodySchema,
  CommentCardRefSchema,
  CommentSchema,
  CommentListSchema,
  CreateCommentInputSchema,
  UpdateCommentInputSchema,
  type CommentBody,
  type CommentCardRef,
  type Comment,
  type CommentList,
  type CreateCommentInput,
  type UpdateCommentInput,
} from './comments.js';

// Tag schemas
export { TagSchema, TagListSchema, type Tag, type TagList } from './tags.js';

// User schemas
export { UserListSchema, type UserList } from './users.js';

// Step schemas
export {
  CreateStepInputSchema,
  UpdateStepInputSchema,
  type CreateStepInput,
  type UpdateStepInput,
} from './steps.js';

// Webhook schemas
export {
  WebhookEventSchema,
  WebhookSchema,
  WebhookListSchema,
  CreateWebhookInputSchema,
  UpdateWebhookInputSchema,
  WebhookTestResponseSchema,
  WebhookSecretEntrySchema,
  WebhookStatusResponseSchema,
  StoreWebhookSecretInputSchema,
  WEBHOOK_EVENTS,
  type WebhookEvent,
  type Webhook,
  type WebhookList,
  type CreateWebhookInput,
  type UpdateWebhookInput,
  type WebhookTestResponse,
  type WebhookSecretEntry,
  type WebhookStatusResponse,
  type StoreWebhookSecretInput,
} from './webhooks.js';

// Reaction schemas
export {
  ReactionEmojiSchema,
  ReactionSchema,
  ReactionListSchema,
  CreateReactionInputSchema,
  ReactionSummarySchema,
  REACTION_EMOJIS,
  type ReactionEmoji,
  type Reaction,
  type ReactionList,
  type CreateReactionInput,
  type ReactionSummary,
} from './reactions.js';

// Notification schemas
export {
  NotificationTypeSchema,
  NotificationSchema,
  NotificationListSchema,
  NotificationCountSchema,
  type NotificationType,
  type Notification,
  type NotificationList,
  type NotificationCount,
} from './notifications.js';

// Vibe Coding schemas
export {
  VIBE_COLUMNS,
  AI_WORK_MODES,
  VibeConfigSchema,
  VibeConfigCardSchema,
  BoardVibeStatusSchema,
  VibeSessionSchema,
  CONFIG_CARD_TEMPLATE,
  CONFIG_CARD_TITLE,
  CONFIG_CARD_TAG,
  type VibeColumnName,
  type AiWorkMode,
  type VibeConfig,
  type VibeConfigCard,
  type BoardVibeStatus,
  type VibeSession,
} from './vibe-config.js';
