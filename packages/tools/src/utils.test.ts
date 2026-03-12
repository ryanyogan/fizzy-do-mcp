import { describe, it, expect } from 'vitest';
import { formatToolSuccess, formatToolError, wrapToolOperation } from './utils.js';
import { FizzyApiError, FizzyNetworkError, FizzyAuthError } from '@fizzy-mcp/shared';

describe('utils', () => {
  describe('formatToolSuccess', () => {
    it('formats data as JSON', () => {
      const result = formatToolSuccess({ id: '123', name: 'Test' });

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toBe(JSON.stringify({ id: '123', name: 'Test' }, null, 2));
      expect(result.isError).toBeUndefined();
    });

    it('includes summary when provided', () => {
      const result = formatToolSuccess({ count: 5 }, 'Found 5 items');

      expect(result.content[0].text).toContain('Found 5 items');
      expect(result.content[0].text).toContain('"count": 5');
    });

    it('handles arrays', () => {
      const result = formatToolSuccess([1, 2, 3]);

      expect(result.content[0].text).toBe('[\n  1,\n  2,\n  3\n]');
    });

    it('handles null and undefined', () => {
      expect(formatToolSuccess(null).content[0].text).toBe('null');
      // undefined serializes to empty string in JSON.stringify with pretty print
      expect(formatToolSuccess(undefined).content[0].text).toBe('');
    });

    it('handles complex nested data', () => {
      const data = {
        board: {
          id: 'b123',
          cards: [
            { id: 'c1', title: 'Card 1' },
            { id: 'c2', title: 'Card 2' },
          ],
        },
      };

      const result = formatToolSuccess(data);
      const parsed = JSON.parse(result.content[0].text);

      expect(parsed).toEqual(data);
    });
  });

  describe('formatToolError', () => {
    it('formats error message with code', () => {
      const error = new FizzyApiError('Bad request', 400);
      const result = formatToolError(error);

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toContain('Error: Bad request');
      expect(result.content[0].text).toContain('Code: API_ERROR');
      expect(result.isError).toBe(true);
    });

    it('indicates when error is retryable', () => {
      const error = new FizzyNetworkError('Connection failed');
      const result = formatToolError(error);

      expect(result.content[0].text).toContain('This error may be retryable');
    });

    it('does not indicate retryable for non-retryable errors', () => {
      const error = new FizzyAuthError('Invalid token');
      const result = formatToolError(error);

      expect(result.content[0].text).not.toContain('retryable');
    });
  });

  describe('wrapToolOperation', () => {
    it('returns success result for Ok operations', async () => {
      const operation = async () => ({
        ok: true as const,
        value: { id: '123', name: 'Test' },
      });

      const result = await wrapToolOperation(operation);

      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain('"id": "123"');
    });

    it('returns error result for Err operations', async () => {
      const operation = async () => ({
        ok: false as const,
        error: new FizzyApiError('Not found', 404),
      });

      const result = await wrapToolOperation(operation);

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error: Not found');
    });

    it('includes success message string', async () => {
      const operation = async () => ({
        ok: true as const,
        value: { id: '123' },
      });

      const result = await wrapToolOperation(operation, 'Operation completed');

      expect(result.content[0].text).toContain('Operation completed');
    });

    it('includes success message function result', async () => {
      const operation = async () => ({
        ok: true as const,
        value: { count: 5 },
      });

      const result = await wrapToolOperation(
        operation,
        (value) => `Found ${value.count} items`,
      );

      expect(result.content[0].text).toContain('Found 5 items');
    });

    it('handles async operations', async () => {
      const operation = async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return { ok: true as const, value: { delayed: true } };
      };

      const result = await wrapToolOperation(operation);

      expect(result.content[0].text).toContain('"delayed": true');
    });
  });

  describe('ToolResult interface', () => {
    it('has required content array', () => {
      const result = formatToolSuccess({ test: true });
      expect(Array.isArray(result.content)).toBe(true);
      expect(result.content.length).toBeGreaterThan(0);
    });

    it('content items have type and text', () => {
      const result = formatToolSuccess({ test: true });
      expect(result.content[0]).toHaveProperty('type', 'text');
      expect(result.content[0]).toHaveProperty('text');
    });

    it('allows additional properties via index signature', () => {
      const result = formatToolSuccess({ test: true });
      // TypeScript should allow this due to index signature
      const extended = { ...result, customProp: 'value' };
      expect(extended.customProp).toBe('value');
    });
  });
});
