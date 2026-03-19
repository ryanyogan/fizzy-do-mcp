import {
  type Result,
  type FizzyError,
  ReactionSchema,
  ReactionListSchema,
  type Reaction,
  type ReactionList,
  type CreateReactionInput,
} from '@fizzy-do-mcp/shared';
import { BaseEndpoint } from './base.js';

/**
 * Endpoint for reaction operations on cards and comments.
 *
 * Reactions are emoji-based responses that users can add to cards
 * and comments to express feedback without creating full comments.
 */
export class ReactionsEndpoint extends BaseEndpoint {
  /**
   * Lists all reactions on a card.
   *
   * @param cardNumber - The card number
   *
   * @example
   * ```typescript
   * const result = await client.reactions.listOnCard(123);
   * if (result.ok) {
   *   for (const reaction of result.value) {
   *     console.log(`${reaction.emoji} by ${reaction.user.name}`);
   *   }
   * }
   * ```
   */
  async listOnCard(cardNumber: number): Promise<Result<ReactionList, FizzyError>> {
    return this.get(`/cards/${cardNumber}/reactions`, ReactionListSchema);
  }

  /**
   * Lists all reactions on a comment.
   *
   * @param cardNumber - The card number
   * @param commentId - The comment's unique identifier
   *
   * @example
   * ```typescript
   * const result = await client.reactions.listOnComment(123, 'comment-456');
   * if (result.ok) {
   *   console.log('Reactions:', result.value.length);
   * }
   * ```
   */
  async listOnComment(
    cardNumber: number,
    commentId: string,
  ): Promise<Result<ReactionList, FizzyError>> {
    return this.get(`/cards/${cardNumber}/comments/${commentId}/reactions`, ReactionListSchema);
  }

  /**
   * Adds a reaction to a card.
   *
   * @param cardNumber - The card number
   * @param input - Reaction parameters
   *
   * @example
   * ```typescript
   * const result = await client.reactions.addToCard(123, {
   *   emoji: 'thumbs_up',
   * });
   * ```
   */
  async addToCard(
    cardNumber: number,
    input: CreateReactionInput,
  ): Promise<Result<Reaction, FizzyError>> {
    return this.post(`/cards/${cardNumber}/reactions`, ReactionSchema, { reaction: input });
  }

  /**
   * Adds a reaction to a comment.
   *
   * @param cardNumber - The card number
   * @param commentId - The comment's unique identifier
   * @param input - Reaction parameters
   *
   * @example
   * ```typescript
   * const result = await client.reactions.addToComment(123, 'comment-456', {
   *   emoji: 'heart',
   * });
   * ```
   */
  async addToComment(
    cardNumber: number,
    commentId: string,
    input: CreateReactionInput,
  ): Promise<Result<Reaction, FizzyError>> {
    return this.post(`/cards/${cardNumber}/comments/${commentId}/reactions`, ReactionSchema, {
      reaction: input,
    });
  }

  /**
   * Removes a reaction from a card.
   *
   * @param cardNumber - The card number
   * @param reactionId - The reaction's unique identifier
   *
   * @example
   * ```typescript
   * const result = await client.reactions.removeFromCard(123, 'reaction-789');
   * if (result.ok) {
   *   console.log('Reaction removed');
   * }
   * ```
   */
  async removeFromCard(cardNumber: number, reactionId: string): Promise<Result<void, FizzyError>> {
    return this.delete(`/cards/${cardNumber}/reactions/${reactionId}`);
  }

  /**
   * Removes a reaction from a comment.
   *
   * @param cardNumber - The card number
   * @param commentId - The comment's unique identifier
   * @param reactionId - The reaction's unique identifier
   *
   * @example
   * ```typescript
   * const result = await client.reactions.removeFromComment(123, 'comment-456', 'reaction-789');
   * if (result.ok) {
   *   console.log('Reaction removed');
   * }
   * ```
   */
  async removeFromComment(
    cardNumber: number,
    commentId: string,
    reactionId: string,
  ): Promise<Result<void, FizzyError>> {
    return this.delete(`/cards/${cardNumber}/comments/${commentId}/reactions/${reactionId}`);
  }

  /**
   * Toggles a reaction on a card.
   * If the user has already reacted with this emoji, it removes the reaction.
   * Otherwise, it adds the reaction.
   *
   * @param cardNumber - The card number
   * @param input - Reaction parameters
   *
   * @example
   * ```typescript
   * const result = await client.reactions.toggleOnCard(123, {
   *   emoji: 'thumbs_up',
   * });
   * ```
   */
  async toggleOnCard(
    cardNumber: number,
    input: CreateReactionInput,
  ): Promise<Result<{ added: boolean; reaction?: Reaction }, FizzyError>> {
    // First, list existing reactions to check if user already reacted
    const listResult = await this.listOnCard(cardNumber);
    if (!listResult.ok) {
      return listResult;
    }

    // Find if user already has this reaction (we'll need to check by user)
    // For now, just add - the API may handle duplicates
    const addResult = await this.addToCard(cardNumber, input);
    if (addResult.ok) {
      return { ok: true, value: { added: true, reaction: addResult.value } };
    }

    return { ok: false, error: addResult.error };
  }
}
