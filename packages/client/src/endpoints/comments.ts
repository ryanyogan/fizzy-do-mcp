import {
  type Result,
  type FizzyError,
  CommentSchema,
  CommentListSchema,
  type Comment,
  type CommentList,
  type CreateCommentInput,
  type UpdateCommentInput,
} from '@fizzy-mcp/shared';
import { BaseEndpoint } from './base.js';

/**
 * Endpoint for comment-related operations.
 *
 * Comments are attached to cards and support rich text.
 */
export class CommentsEndpoint extends BaseEndpoint {
  /**
   * Lists comments on a card, sorted chronologically (oldest first).
   *
   * Results are paginated. Check the Link header for the next page URL.
   *
   * @param cardNumber - The card number
   *
   * @example
   * ```typescript
   * const result = await client.comments.list(42);
   * if (result.ok) {
   *   for (const comment of result.value) {
   *     console.log(`${comment.creator.name}: ${comment.body.plain_text}`);
   *   }
   * }
   * ```
   */
  async list(cardNumber: number): Promise<Result<CommentList, FizzyError>> {
    return this.get(`/cards/${cardNumber}/comments`, CommentListSchema);
  }

  /**
   * Gets a specific comment by ID.
   *
   * @param cardNumber - The card number
   * @param commentId - The comment's unique identifier
   *
   * @example
   * ```typescript
   * const result = await client.comments.getById(42, 'comment-id');
   * if (result.ok) {
   *   console.log('Comment:', result.value.body.plain_text);
   * }
   * ```
   */
  async getById(cardNumber: number, commentId: string): Promise<Result<Comment, FizzyError>> {
    return this.get(`/cards/${cardNumber}/comments/${commentId}`, CommentSchema);
  }

  /**
   * Creates a new comment on a card.
   *
   * @param cardNumber - The card number
   * @param input - Comment creation parameters
   *
   * @example
   * ```typescript
   * const result = await client.comments.create(42, {
   *   body: '<p>This looks great!</p>',
   * });
   * if (result.ok) {
   *   console.log('Created comment:', result.value.id);
   * }
   * ```
   */
  async create(cardNumber: number, input: CreateCommentInput): Promise<Result<Comment, FizzyError>> {
    return this.post(`/cards/${cardNumber}/comments`, CommentSchema, { comment: input });
  }

  /**
   * Updates a comment.
   *
   * Only the comment creator can update their comments.
   *
   * @param cardNumber - The card number
   * @param commentId - The comment's unique identifier
   * @param input - Comment update parameters
   *
   * @example
   * ```typescript
   * const result = await client.comments.update(42, 'comment-id', {
   *   body: '<p>Updated comment</p>',
   * });
   * ```
   */
  async update(
    cardNumber: number,
    commentId: string,
    input: UpdateCommentInput,
  ): Promise<Result<Comment, FizzyError>> {
    return this.put(`/cards/${cardNumber}/comments/${commentId}`, CommentSchema, {
      comment: input,
    });
  }

  /**
   * Deletes a comment.
   *
   * Only the comment creator can delete their comments.
   *
   * @param cardNumber - The card number
   * @param commentId - The comment's unique identifier
   *
   * @example
   * ```typescript
   * const result = await client.comments.delete(42, 'comment-id');
   * if (result.ok) {
   *   console.log('Comment deleted');
   * }
   * ```
   */
  async deleteComment(cardNumber: number, commentId: string): Promise<Result<void, FizzyError>> {
    return this.delete(`/cards/${cardNumber}/comments/${commentId}`);
  }
}
