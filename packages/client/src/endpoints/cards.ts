import {
  type Result,
  type FizzyError,
  CardSchema,
  CardListSchema,
  type Card,
  type CardList,
  type ListCardsParams,
  type CreateCardInput,
  type UpdateCardInput,
} from '@fizzy-mcp/shared';
import { BaseEndpoint } from './base.js';

/**
 * Endpoint for card-related operations.
 *
 * Cards are tasks or items of work on a board. They can be organized
 * into columns, tagged, assigned to users, and have comments.
 */
export class CardsEndpoint extends BaseEndpoint {
  /**
   * Lists cards with optional filters.
   *
   * Results are paginated. Check the Link header in the response
   * for the next page URL.
   *
   * @param params - Filter and sort parameters
   *
   * @example
   * ```typescript
   * // List all cards
   * const result = await client.cards.list();
   *
   * // List cards on a specific board
   * const result = await client.cards.list({
   *   board_ids: ['board-id'],
   *   sorted_by: 'newest',
   * });
   *
   * // Search for cards
   * const result = await client.cards.list({
   *   terms: ['bug', 'critical'],
   * });
   * ```
   */
  async list(params?: ListCardsParams): Promise<Result<CardList, FizzyError>> {
    return this.get('/cards', CardListSchema, this.buildCardParams(params));
  }

  /**
   * Gets a specific card by its number.
   *
   * @param cardNumber - The card number (visible in Fizzy URL)
   *
   * @example
   * ```typescript
   * const result = await client.cards.getByNumber(42);
   * if (result.ok) {
   *   console.log('Card:', result.value.title);
   *   console.log('Status:', result.value.closed ? 'Closed' : 'Open');
   * }
   * ```
   */
  async getByNumber(cardNumber: number): Promise<Result<Card, FizzyError>> {
    return this.get(`/cards/${cardNumber}`, CardSchema);
  }

  /**
   * Creates a new card on a board.
   *
   * @param boardId - The board's unique identifier
   * @param input - Card creation parameters
   *
   * @example
   * ```typescript
   * const result = await client.cards.create('board-id', {
   *   title: 'Fix login bug',
   *   description: '<p>Users cannot log in with email.</p>',
   *   status: 'published',
   * });
   * if (result.ok) {
   *   console.log('Created card #', result.value.number);
   * }
   * ```
   */
  async create(boardId: string, input: CreateCardInput): Promise<Result<Card, FizzyError>> {
    return this.post(`/boards/${boardId}/cards`, CardSchema, { card: input });
  }

  /**
   * Updates a card.
   *
   * @param cardNumber - The card number
   * @param input - Card update parameters
   *
   * @example
   * ```typescript
   * const result = await client.cards.update(42, {
   *   title: 'Updated title',
   *   description: '<p>New description</p>',
   * });
   * ```
   */
  async update(cardNumber: number, input: UpdateCardInput): Promise<Result<Card, FizzyError>> {
    return this.put(`/cards/${cardNumber}`, CardSchema, { card: input });
  }

  /**
   * Deletes a card.
   *
   * Only the card creator or board administrators can delete cards.
   *
   * @param cardNumber - The card number
   *
   * @example
   * ```typescript
   * const result = await client.cards.delete(42);
   * if (result.ok) {
   *   console.log('Card deleted');
   * }
   * ```
   */
  async deleteCard(cardNumber: number): Promise<Result<void, FizzyError>> {
    return this.delete(`/cards/${cardNumber}`);
  }

  /**
   * Closes (completes) a card.
   *
   * @param cardNumber - The card number
   *
   * @example
   * ```typescript
   * const result = await client.cards.close(42);
   * if (result.ok) {
   *   console.log('Card closed');
   * }
   * ```
   */
  async close(cardNumber: number): Promise<Result<void, FizzyError>> {
    return this.postNoContent(`/cards/${cardNumber}/closure`);
  }

  /**
   * Reopens a closed card.
   *
   * @param cardNumber - The card number
   *
   * @example
   * ```typescript
   * const result = await client.cards.reopen(42);
   * if (result.ok) {
   *   console.log('Card reopened');
   * }
   * ```
   */
  async reopen(cardNumber: number): Promise<Result<void, FizzyError>> {
    return this.delete(`/cards/${cardNumber}/closure`);
  }

  /**
   * Moves a card to "Not Now" status.
   *
   * @param cardNumber - The card number
   *
   * @example
   * ```typescript
   * const result = await client.cards.postpone(42);
   * if (result.ok) {
   *   console.log('Card moved to Not Now');
   * }
   * ```
   */
  async postpone(cardNumber: number): Promise<Result<void, FizzyError>> {
    return this.postNoContent(`/cards/${cardNumber}/not_now`);
  }

  /**
   * Moves a card into a column (triages it).
   *
   * @param cardNumber - The card number
   * @param columnId - The column's unique identifier
   *
   * @example
   * ```typescript
   * const result = await client.cards.triage(42, 'column-id');
   * if (result.ok) {
   *   console.log('Card triaged to column');
   * }
   * ```
   */
  async triage(cardNumber: number, columnId: string): Promise<Result<void, FizzyError>> {
    return this.postNoContent(`/cards/${cardNumber}/triage`, { column_id: columnId });
  }

  /**
   * Sends a card back to triage (removes it from its column).
   *
   * @param cardNumber - The card number
   *
   * @example
   * ```typescript
   * const result = await client.cards.untriage(42);
   * if (result.ok) {
   *   console.log('Card sent back to triage');
   * }
   * ```
   */
  async untriage(cardNumber: number): Promise<Result<void, FizzyError>> {
    return this.delete(`/cards/${cardNumber}/triage`);
  }

  /**
   * Toggles a tag on a card.
   *
   * If the tag doesn't exist, it will be created.
   *
   * @param cardNumber - The card number
   * @param tagTitle - The tag title (leading # is stripped)
   *
   * @example
   * ```typescript
   * // Add or remove the "bug" tag
   * const result = await client.cards.toggleTag(42, 'bug');
   * ```
   */
  async toggleTag(cardNumber: number, tagTitle: string): Promise<Result<void, FizzyError>> {
    return this.postNoContent(`/cards/${cardNumber}/taggings`, { tag_title: tagTitle });
  }

  /**
   * Toggles assignment of a user to a card.
   *
   * @param cardNumber - The card number
   * @param assigneeId - The user's unique identifier
   *
   * @example
   * ```typescript
   * // Assign or unassign a user
   * const result = await client.cards.toggleAssignment(42, 'user-id');
   * ```
   */
  async toggleAssignment(
    cardNumber: number,
    assigneeId: string,
  ): Promise<Result<void, FizzyError>> {
    return this.postNoContent(`/cards/${cardNumber}/assignments`, { assignee_id: assigneeId });
  }

  /**
   * Subscribes the current user to notifications for a card.
   *
   * @param cardNumber - The card number
   *
   * @example
   * ```typescript
   * const result = await client.cards.watch(42);
   * ```
   */
  async watch(cardNumber: number): Promise<Result<void, FizzyError>> {
    return this.postNoContent(`/cards/${cardNumber}/watch`);
  }

  /**
   * Unsubscribes the current user from notifications for a card.
   *
   * @param cardNumber - The card number
   *
   * @example
   * ```typescript
   * const result = await client.cards.unwatch(42);
   * ```
   */
  async unwatch(cardNumber: number): Promise<Result<void, FizzyError>> {
    return this.delete(`/cards/${cardNumber}/watch`);
  }

  /**
   * Pins a card for quick access.
   *
   * @param cardNumber - The card number
   *
   * @example
   * ```typescript
   * const result = await client.cards.pin(42);
   * ```
   */
  async pin(cardNumber: number): Promise<Result<void, FizzyError>> {
    return this.postNoContent(`/cards/${cardNumber}/pin`);
  }

  /**
   * Unpins a card.
   *
   * @param cardNumber - The card number
   *
   * @example
   * ```typescript
   * const result = await client.cards.unpin(42);
   * ```
   */
  async unpin(cardNumber: number): Promise<Result<void, FizzyError>> {
    return this.delete(`/cards/${cardNumber}/pin`);
  }

  /**
   * Marks a card as golden.
   *
   * @param cardNumber - The card number
   *
   * @example
   * ```typescript
   * const result = await client.cards.markGolden(42);
   * ```
   */
  async markGolden(cardNumber: number): Promise<Result<void, FizzyError>> {
    return this.postNoContent(`/cards/${cardNumber}/goldness`);
  }

  /**
   * Removes golden status from a card.
   *
   * @param cardNumber - The card number
   *
   * @example
   * ```typescript
   * const result = await client.cards.unmarkGolden(42);
   * ```
   */
  async unmarkGolden(cardNumber: number): Promise<Result<void, FizzyError>> {
    return this.delete(`/cards/${cardNumber}/goldness`);
  }

  /**
   * Converts ListCardsParams to query string parameters.
   */
  private buildCardParams(
    params?: ListCardsParams,
  ): Record<string, string | string[] | undefined> | undefined {
    if (!params) return undefined;

    return {
      board_ids: params.board_ids,
      tag_ids: params.tag_ids,
      assignee_ids: params.assignee_ids,
      creator_ids: params.creator_ids,
      closer_ids: params.closer_ids,
      card_ids: params.card_ids,
      indexed_by: params.indexed_by,
      sorted_by: params.sorted_by,
      assignment_status: params.assignment_status,
      creation: params.creation,
      closure: params.closure,
      terms: params.terms,
    };
  }
}
