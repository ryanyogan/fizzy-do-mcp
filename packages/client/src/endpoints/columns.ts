import {
  type Result,
  type FizzyError,
  ColumnSchema,
  ColumnListSchema,
  type Column,
  type ColumnList,
  type CreateColumnInput,
  type UpdateColumnInput,
} from '@fizzy-mcp/shared';
import { BaseEndpoint } from './base.js';

/**
 * Endpoint for column-related operations.
 *
 * Columns represent stages in a workflow on a board.
 * Cards move through columns as they progress.
 */
export class ColumnsEndpoint extends BaseEndpoint {
  /**
   * Lists all columns on a board, sorted by position.
   *
   * @param boardId - The board's unique identifier
   *
   * @example
   * ```typescript
   * const result = await client.columns.list('03f5v9zkft4hj9qq0lsn9ohcm');
   * if (result.ok) {
   *   for (const column of result.value) {
   *     console.log(`${column.name} (${column.color.name})`);
   *   }
   * }
   * ```
   */
  async list(boardId: string): Promise<Result<ColumnList, FizzyError>> {
    return this.get(`/boards/${boardId}/columns`, ColumnListSchema);
  }

  /**
   * Gets a specific column by ID.
   *
   * @param boardId - The board's unique identifier
   * @param columnId - The column's unique identifier
   *
   * @example
   * ```typescript
   * const result = await client.columns.getById('board-id', 'column-id');
   * if (result.ok) {
   *   console.log('Column:', result.value.name);
   * }
   * ```
   */
  async getById(boardId: string, columnId: string): Promise<Result<Column, FizzyError>> {
    return this.get(`/boards/${boardId}/columns/${columnId}`, ColumnSchema);
  }

  /**
   * Creates a new column on a board.
   *
   * @param boardId - The board's unique identifier
   * @param input - Column creation parameters
   *
   * @example
   * ```typescript
   * const result = await client.columns.create('board-id', {
   *   name: 'In Progress',
   *   color: 'var(--color-card-4)', // Lime
   * });
   * if (result.ok) {
   *   console.log('Created column:', result.value.id);
   * }
   * ```
   */
  async create(boardId: string, input: CreateColumnInput): Promise<Result<Column, FizzyError>> {
    return this.post(`/boards/${boardId}/columns`, ColumnSchema, { column: input });
  }

  /**
   * Updates a column.
   *
   * @param boardId - The board's unique identifier
   * @param columnId - The column's unique identifier
   * @param input - Column update parameters
   *
   * @example
   * ```typescript
   * const result = await client.columns.update('board-id', 'column-id', {
   *   name: 'Done',
   *   color: 'var(--color-card-5)', // Aqua
   * });
   * ```
   */
  async update(
    boardId: string,
    columnId: string,
    input: UpdateColumnInput,
  ): Promise<Result<void, FizzyError>> {
    return this.putNoContent(`/boards/${boardId}/columns/${columnId}`, { column: input });
  }

  /**
   * Deletes a column.
   *
   * @param boardId - The board's unique identifier
   * @param columnId - The column's unique identifier
   *
   * @example
   * ```typescript
   * const result = await client.columns.delete('board-id', 'column-id');
   * if (result.ok) {
   *   console.log('Column deleted');
   * }
   * ```
   */
  async deleteColumn(boardId: string, columnId: string): Promise<Result<void, FizzyError>> {
    return this.delete(`/boards/${boardId}/columns/${columnId}`);
  }
}
