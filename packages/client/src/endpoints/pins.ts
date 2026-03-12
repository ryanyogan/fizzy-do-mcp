import { type Result, type FizzyError, CardListSchema, type CardList } from '@fizzy-mcp/shared';
import { GlobalEndpoint } from './base.js';
import type { HttpClient } from '../http/types.js';

/**
 * Endpoint for pin-related operations.
 *
 * Pins let users keep quick access to important cards.
 */
export class PinsEndpoint extends GlobalEndpoint {
  constructor(http: HttpClient) {
    super({ http, accountSlug: '' });
  }

  /**
   * Gets the current user's pinned cards.
   *
   * This endpoint is not paginated and returns up to 100 cards.
   *
   * @example
   * ```typescript
   * const result = await client.pins.list();
   * if (result.ok) {
   *   for (const card of result.value) {
   *     console.log(`Pinned: ${card.title}`);
   *   }
   * }
   * ```
   */
  async list(): Promise<Result<CardList, FizzyError>> {
    return this.get('/my/pins', CardListSchema);
  }
}
