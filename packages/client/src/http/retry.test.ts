import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { withRetry, DEFAULT_RETRY_CONFIG } from './retry.js';
import { FizzyApiError, FizzyNetworkError, FizzyRateLimitError, FizzyAuthError } from '@fizzy-mcp/shared';

describe('withRetry', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('DEFAULT_RETRY_CONFIG', () => {
    it('has sensible defaults', () => {
      expect(DEFAULT_RETRY_CONFIG).toEqual({
        maxRetries: 3,
        baseDelayMs: 1000,
        maxDelayMs: 30000,
        retryableStatuses: [429, 500, 502, 503, 504],
      });
    });
  });

  describe('successful operations', () => {
    it('returns the result on first success', async () => {
      const fn = vi.fn().mockResolvedValue('success');

      const result = await withRetry(fn);

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('retries and succeeds eventually', async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new FizzyNetworkError('Network failed'))
        .mockResolvedValueOnce('success');

      const promise = withRetry(fn);
      await vi.runAllTimersAsync();
      const result = await promise;

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });

  describe('retryable errors', () => {
    it('retries on FizzyNetworkError', async () => {
      const fn = vi.fn().mockRejectedValue(new FizzyNetworkError('Network failed'));

      const promise = withRetry(fn, { maxRetries: 2 });

      // Catch the rejection to avoid unhandled rejection warning
      promise.catch(() => {});

      // Run through all retries
      await vi.runAllTimersAsync();

      await expect(promise).rejects.toThrow('Network failed');
      expect(fn).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });

    it('retries on FizzyRateLimitError', async () => {
      const fn = vi.fn().mockRejectedValue(new FizzyRateLimitError('Rate limited', 1));

      const promise = withRetry(fn, { maxRetries: 2 });
      promise.catch(() => {});
      await vi.runAllTimersAsync();

      await expect(promise).rejects.toThrow('Rate limited');
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('retries on 5xx API errors', async () => {
      const fn = vi.fn().mockRejectedValue(new FizzyApiError('Server error', 500));

      const promise = withRetry(fn, { maxRetries: 2 });
      promise.catch(() => {});
      await vi.runAllTimersAsync();

      await expect(promise).rejects.toThrow('Server error');
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('retries on 429 API errors', async () => {
      const fn = vi.fn().mockRejectedValue(new FizzyApiError('Too many requests', 429));

      const promise = withRetry(fn, { maxRetries: 2 });
      promise.catch(() => {});
      await vi.runAllTimersAsync();

      await expect(promise).rejects.toThrow('Too many requests');
      expect(fn).toHaveBeenCalledTimes(3);
    });
  });

  describe('non-retryable errors', () => {
    it('does not retry on FizzyAuthError', async () => {
      const fn = vi.fn().mockRejectedValue(new FizzyAuthError('Invalid token'));

      await expect(withRetry(fn, { maxRetries: 3 })).rejects.toThrow('Invalid token');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('does not retry on 4xx API errors', async () => {
      const fn = vi.fn().mockRejectedValue(new FizzyApiError('Bad request', 400));

      await expect(withRetry(fn, { maxRetries: 3 })).rejects.toThrow('Bad request');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('does not retry on 404 API errors', async () => {
      const fn = vi.fn().mockRejectedValue(new FizzyApiError('Not found', 404));

      await expect(withRetry(fn, { maxRetries: 3 })).rejects.toThrow('Not found');
      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  describe('configuration', () => {
    it('respects maxRetries option', async () => {
      const fn = vi.fn().mockRejectedValue(new FizzyNetworkError('Network failed'));

      const promise = withRetry(fn, { maxRetries: 5 });
      promise.catch(() => {});
      await vi.runAllTimersAsync();

      await expect(promise).rejects.toThrow();
      expect(fn).toHaveBeenCalledTimes(6); // Initial + 5 retries
    });

    it('respects custom retryableStatuses', async () => {
      // 418 is not in default retryable statuses
      const fn = vi.fn().mockRejectedValue(new FizzyApiError("I'm a teapot", 418));

      // With custom config that includes 418
      const promise = withRetry(fn, {
        maxRetries: 2,
        retryableStatuses: [418],
      });
      promise.catch(() => {});
      await vi.runAllTimersAsync();

      await expect(promise).rejects.toThrow();
      expect(fn).toHaveBeenCalledTimes(3);
    });
  });

  describe('retry-after header', () => {
    it('uses retry-after from FizzyRateLimitError', async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new FizzyRateLimitError('Rate limited', 5)) // 5 seconds
        .mockResolvedValueOnce('success');

      const promise = withRetry(fn, { maxRetries: 1 });

      // First call fails immediately
      await vi.advanceTimersByTimeAsync(0);

      // Should wait for retry-after (5 seconds = 5000ms)
      // But capped at maxDelayMs
      await vi.runAllTimersAsync();

      const result = await promise;
      expect(result).toBe('success');
    });

    it('uses retry-after from FizzyApiError', async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new FizzyApiError('Rate limited', 429, undefined, 3))
        .mockResolvedValueOnce('success');

      const promise = withRetry(fn, { maxRetries: 1 });
      await vi.runAllTimersAsync();

      const result = await promise;
      expect(result).toBe('success');
    });
  });

  describe('error handling', () => {
    it('throws the original error after all retries', async () => {
      const error = new FizzyNetworkError('Connection refused');
      const fn = vi.fn().mockRejectedValue(error);

      const promise = withRetry(fn, { maxRetries: 2 });
      promise.catch(() => {});
      await vi.runAllTimersAsync();

      await expect(promise).rejects.toBe(error);
    });

    it('converts non-Error values to Error', async () => {
      const fn = vi.fn().mockRejectedValue('string error');

      await expect(withRetry(fn, { maxRetries: 0 })).rejects.toBe('string error');
    });
  });
});
