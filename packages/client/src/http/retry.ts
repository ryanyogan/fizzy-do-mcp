import { FizzyApiError, FizzyRateLimitError, FizzyNetworkError } from '@fizzy-mcp/shared';

/**
 * Configuration for retry behavior.
 */
export interface RetryConfig {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries: number;

  /** Base delay in milliseconds for exponential backoff (default: 1000) */
  baseDelayMs: number;

  /** Maximum delay in milliseconds (default: 30000) */
  maxDelayMs: number;

  /** HTTP status codes that should trigger a retry (default: [429, 500, 502, 503, 504]) */
  retryableStatuses: number[];
}

/**
 * Default retry configuration.
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
  retryableStatuses: [429, 500, 502, 503, 504],
};

/**
 * Sleeps for the specified number of milliseconds.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calculates the delay for exponential backoff with jitter.
 *
 * @param attempt - The current attempt number (0-based)
 * @param baseDelayMs - Base delay in milliseconds
 * @param maxDelayMs - Maximum delay in milliseconds
 * @returns Delay in milliseconds
 */
function calculateBackoff(attempt: number, baseDelayMs: number, maxDelayMs: number): number {
  // Exponential backoff: base * 2^attempt
  const exponentialDelay = baseDelayMs * Math.pow(2, attempt);

  // Add jitter (±30% of the delay) to prevent thundering herd
  const jitter = exponentialDelay * 0.3 * (Math.random() * 2 - 1);

  // Cap at max delay
  return Math.min(exponentialDelay + jitter, maxDelayMs);
}

/**
 * Determines if an error is retryable.
 */
function isRetryableError(error: unknown, retryableStatuses: number[]): boolean {
  if (error instanceof FizzyRateLimitError) {
    return true;
  }

  if (error instanceof FizzyNetworkError) {
    return true;
  }

  if (error instanceof FizzyApiError) {
    return retryableStatuses.includes(error.status);
  }

  return false;
}

/**
 * Gets the retry-after delay from an error, if present.
 */
function getRetryAfterMs(error: unknown): number | undefined {
  if (error instanceof FizzyRateLimitError && error.retryAfter !== undefined) {
    return error.retryAfter * 1000;
  }

  if (error instanceof FizzyApiError && error.retryAfter !== undefined) {
    return error.retryAfter * 1000;
  }

  return undefined;
}

/**
 * Wraps an async function with retry logic using exponential backoff.
 *
 * @param fn - The async function to retry
 * @param config - Retry configuration (optional, uses defaults if not provided)
 * @returns The result of the function, or throws the last error after all retries
 *
 * @example
 * ```typescript
 * const result = await withRetry(
 *   () => httpClient.request({ method: 'GET', path: '/cards' }),
 *   { maxRetries: 5 }
 * );
 * ```
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {},
): Promise<T> {
  const { maxRetries, baseDelayMs, maxDelayMs, retryableStatuses } = {
    ...DEFAULT_RETRY_CONFIG,
    ...config,
  };

  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if we should retry
      const shouldRetry = isRetryableError(error, retryableStatuses) && attempt < maxRetries;

      if (!shouldRetry) {
        throw error;
      }

      // Calculate delay
      const retryAfterMs = getRetryAfterMs(error);
      const backoffDelay = calculateBackoff(attempt, baseDelayMs, maxDelayMs);
      const delay = retryAfterMs !== undefined ? Math.min(retryAfterMs, maxDelayMs) : backoffDelay;

      // Wait before retrying
      await sleep(delay);
    }
  }

  // This should never happen, but TypeScript needs it
  throw lastError ?? new Error('Unexpected retry loop exit');
}
