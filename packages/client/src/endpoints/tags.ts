import { type Result, type FizzyError, TagListSchema, type TagList } from '@fizzy-mcp/shared';
import { BaseEndpoint } from './base.js';

/**
 * Endpoint for tag-related operations.
 *
 * Tags are labels that can be applied to cards for organization and filtering.
 */
export class TagsEndpoint extends BaseEndpoint {
  /**
   * Lists all tags in the account, sorted alphabetically.
   *
   * @example
   * ```typescript
   * const result = await client.tags.list();
   * if (result.ok) {
   *   for (const tag of result.value) {
   *     console.log(`#${tag.title}`);
   *   }
   * }
   * ```
   */
  async list(): Promise<Result<TagList, FizzyError>> {
    return this.get('/tags', TagListSchema);
  }
}
