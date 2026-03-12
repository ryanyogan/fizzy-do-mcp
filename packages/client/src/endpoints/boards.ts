import {
  type Result,
  type FizzyError,
  BoardSchema,
  BoardListSchema,
  type Board,
  type BoardList,
  type CreateBoardInput,
  type UpdateBoardInput,
} from '@fizzy-mcp/shared';
import { BaseEndpoint } from './base.js';

/**
 * Endpoint for board-related operations.
 *
 * Boards are where you organize your work - they contain cards organized into columns.
 */
export class BoardsEndpoint extends BaseEndpoint {
  /**
   * Lists all boards the user has access to.
   *
   * @example
   * ```typescript
   * const result = await client.boards.list();
   * if (result.ok) {
   *   for (const board of result.value) {
   *     console.log(`${board.name} (${board.id})`);
   *   }
   * }
   * ```
   */
  async list(): Promise<Result<BoardList, FizzyError>> {
    return this.get('/boards', BoardListSchema);
  }

  /**
   * Gets a specific board by ID.
   *
   * @param boardId - The board's unique identifier
   *
   * @example
   * ```typescript
   * const result = await client.boards.get('03f5v9zkft4hj9qq0lsn9ohcm');
   * if (result.ok) {
   *   console.log('Board:', result.value.name);
   * }
   * ```
   */
  async getById(boardId: string): Promise<Result<Board, FizzyError>> {
    return this.get(`/boards/${boardId}`, BoardSchema);
  }

  /**
   * Creates a new board.
   *
   * @param input - Board creation parameters
   *
   * @example
   * ```typescript
   * const result = await client.boards.create({
   *   name: 'My New Board',
   *   all_access: true,
   * });
   * if (result.ok) {
   *   console.log('Created board:', result.value.id);
   * }
   * ```
   */
  async create(input: CreateBoardInput): Promise<Result<Board, FizzyError>> {
    return this.post('/boards', BoardSchema, { board: input });
  }

  /**
   * Updates a board.
   *
   * Only board administrators can update a board.
   *
   * @param boardId - The board's unique identifier
   * @param input - Board update parameters
   *
   * @example
   * ```typescript
   * const result = await client.boards.update('03f5v9zkft4hj9qq0lsn9ohcm', {
   *   name: 'Updated Name',
   *   auto_postpone_period_in_days: 30,
   * });
   * ```
   */
  async update(boardId: string, input: UpdateBoardInput): Promise<Result<void, FizzyError>> {
    return this.putNoContent(`/boards/${boardId}`, { board: input });
  }

  /**
   * Deletes a board.
   *
   * Only board administrators can delete a board.
   *
   * @param boardId - The board's unique identifier
   *
   * @example
   * ```typescript
   * const result = await client.boards.delete('03f5v9zkft4hj9qq0lsn9ohcm');
   * if (result.ok) {
   *   console.log('Board deleted');
   * }
   * ```
   */
  async deleteBoard(boardId: string): Promise<Result<void, FizzyError>> {
    return this.delete(`/boards/${boardId}`);
  }

  /**
   * Publishes a board, making it publicly accessible via a shareable link.
   *
   * Only board administrators can publish a board.
   *
   * @param boardId - The board's unique identifier
   * @returns The board with the new public_url field
   *
   * @example
   * ```typescript
   * const result = await client.boards.publish('03f5v9zkft4hj9qq0lsn9ohcm');
   * if (result.ok) {
   *   console.log('Public URL:', result.value.public_url);
   * }
   * ```
   */
  async publish(boardId: string): Promise<Result<Board, FizzyError>> {
    return this.post(`/boards/${boardId}/publication`, BoardSchema);
  }

  /**
   * Unpublishes a board, removing public access.
   *
   * Only board administrators can unpublish a board.
   *
   * @param boardId - The board's unique identifier
   *
   * @example
   * ```typescript
   * const result = await client.boards.unpublish('03f5v9zkft4hj9qq0lsn9ohcm');
   * if (result.ok) {
   *   console.log('Board unpublished');
   * }
   * ```
   */
  async unpublish(boardId: string): Promise<Result<void, FizzyError>> {
    return this.delete(`/boards/${boardId}/publication`);
  }
}
