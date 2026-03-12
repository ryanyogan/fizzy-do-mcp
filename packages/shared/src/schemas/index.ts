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
