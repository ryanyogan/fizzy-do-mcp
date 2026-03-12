import {
  FizzyApiError,
  FizzyAuthError,
  FizzyForbiddenError,
  FizzyNotFoundError,
  FizzyNetworkError,
  FizzyRateLimitError,
  FizzyValidationError,
  type ValidationIssue,
} from '@fizzy-mcp/shared';
import type { HttpClient, HttpClientConfig, HttpRequestConfig, HttpResponse } from './types.js';
import { withRetry, type RetryConfig } from './retry.js';

/**
 * HTTP client implementation using the Fetch API.
 *
 * This implementation is compatible with both Node.js (18+) and Cloudflare Workers.
 */
export class FetchHttpClient implements HttpClient {
  private readonly baseUrl: string;
  private readonly defaultHeaders: Record<string, string>;
  private readonly defaultTimeout: number;
  private readonly retryConfig: Partial<RetryConfig> | undefined;

  constructor(config: HttpClientConfig, retryConfig?: Partial<RetryConfig>) {
    // Ensure base URL doesn't have trailing slash
    this.baseUrl = config.baseUrl.replace(/\/+$/, '');
    this.defaultHeaders = config.headers ?? {};
    this.defaultTimeout = config.timeout ?? 30000;
    this.retryConfig = retryConfig ?? undefined;
  }

  /**
   * Makes an HTTP request with automatic retry for transient errors.
   */
  async request<T>(config: HttpRequestConfig): Promise<HttpResponse<T>> {
    return withRetry(() => this.executeRequest<T>(config), this.retryConfig ?? {});
  }

  /**
   * Executes a single HTTP request without retry.
   */
  private async executeRequest<T>(config: HttpRequestConfig): Promise<HttpResponse<T>> {
    const url = this.buildUrl(config.path, config.params);
    const headers = { ...this.defaultHeaders, ...config.headers };
    const timeout = config.timeout ?? this.defaultTimeout;

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const fetchOptions: RequestInit = {
        method: config.method,
        headers,
        signal: controller.signal,
      };

      if (config.body !== undefined) {
        fetchOptions.body = JSON.stringify(config.body);
      }

      const response = await fetch(url, fetchOptions);

      clearTimeout(timeoutId);

      // Handle error responses
      if (!response.ok) {
        await this.handleErrorResponse(response);
      }

      // Parse response body
      const data = await this.parseResponseBody<T>(response);

      return {
        data,
        status: response.status,
        headers: response.headers,
      };
    } catch (error) {
      clearTimeout(timeoutId);

      // Re-throw Fizzy errors as-is
      if (
        error instanceof FizzyApiError ||
        error instanceof FizzyAuthError ||
        error instanceof FizzyForbiddenError ||
        error instanceof FizzyNotFoundError ||
        error instanceof FizzyRateLimitError ||
        error instanceof FizzyValidationError
      ) {
        throw error;
      }

      // Handle abort/timeout
      if (error instanceof Error && error.name === 'AbortError') {
        throw new FizzyNetworkError(`Request timed out after ${timeout}ms`);
      }

      // Handle network errors
      if (error instanceof TypeError) {
        throw new FizzyNetworkError(`Network error: ${error.message}`, error);
      }

      // Unknown error
      throw new FizzyNetworkError(
        error instanceof Error ? error.message : String(error),
        error instanceof Error ? error : undefined,
      );
    }
  }

  /**
   * Builds a full URL with query parameters.
   */
  private buildUrl(path: string, params?: Record<string, string | string[] | undefined>): string {
    // Ensure path starts with /
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const url = new URL(`${this.baseUrl}${normalizedPath}`);

    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value === undefined) continue;

        if (Array.isArray(value)) {
          // Handle array parameters (e.g., tag_ids[]=a&tag_ids[]=b)
          for (const v of value) {
            url.searchParams.append(`${key}[]`, v);
          }
        } else {
          url.searchParams.set(key, value);
        }
      }
    }

    return url.toString();
  }

  /**
   * Parses the response body as JSON.
   */
  private async parseResponseBody<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type');

    // Handle empty responses (204 No Content, etc.)
    if (response.status === 204 || !contentType?.includes('application/json')) {
      return {} as T;
    }

    const text = await response.text();
    if (!text) {
      return {} as T;
    }

    try {
      return JSON.parse(text) as T;
    } catch {
      throw new FizzyApiError(`Invalid JSON response: ${text.slice(0, 100)}`, response.status);
    }
  }

  /**
   * Handles error responses from the API.
   */
  private async handleErrorResponse(response: Response): Promise<never> {
    const retryAfter = this.parseRetryAfter(response.headers.get('Retry-After'));

    // Parse error body if present
    let errorBody: unknown;
    try {
      const text = await response.text();
      if (text) {
        errorBody = JSON.parse(text);
      }
    } catch {
      // Ignore parse errors
    }

    // Handle specific status codes
    switch (response.status) {
      case 401:
        throw new FizzyAuthError('Authentication failed. Check your access token.');

      case 403:
        throw new FizzyForbiddenError('You do not have permission to perform this action.');

      case 404:
        throw new FizzyNotFoundError('The requested resource was not found.');

      case 422: {
        // Validation error with field details
        const issues = this.parseValidationErrors(errorBody);
        throw new FizzyValidationError('Validation failed', issues);
      }

      case 429:
        throw new FizzyRateLimitError(
          'Rate limit exceeded. Please slow down your requests.',
          retryAfter,
        );

      default: {
        const message = this.extractErrorMessage(errorBody) ?? `API error: ${response.status}`;
        throw new FizzyApiError(message, response.status, undefined, retryAfter);
      }
    }
  }

  /**
   * Parses the Retry-After header value.
   */
  private parseRetryAfter(value: string | null): number | undefined {
    if (!value) return undefined;

    // Try parsing as seconds
    const seconds = parseInt(value, 10);
    if (!isNaN(seconds)) {
      return seconds;
    }

    // Try parsing as HTTP date
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      const delayMs = date.getTime() - Date.now();
      return Math.max(0, Math.ceil(delayMs / 1000));
    }

    return undefined;
  }

  /**
   * Parses validation errors from the API response.
   */
  private parseValidationErrors(body: unknown): ValidationIssue[] {
    if (!body || typeof body !== 'object') {
      return [{ path: [], message: 'Validation failed' }];
    }

    const issues: ValidationIssue[] = [];

    for (const [field, messages] of Object.entries(body as Record<string, unknown>)) {
      if (Array.isArray(messages)) {
        for (const message of messages) {
          issues.push({
            path: [field],
            message: String(message),
          });
        }
      } else if (typeof messages === 'string') {
        issues.push({
          path: [field],
          message: messages,
        });
      }
    }

    return issues.length > 0 ? issues : [{ path: [], message: 'Validation failed' }];
  }

  /**
   * Extracts an error message from the response body.
   */
  private extractErrorMessage(body: unknown): string | undefined {
    if (!body || typeof body !== 'object') return undefined;

    const obj = body as Record<string, unknown>;

    // Try common error message fields
    if (typeof obj['error'] === 'string') return obj['error'];
    if (typeof obj['message'] === 'string') return obj['message'];
    if (typeof obj['errors'] === 'string') return obj['errors'];

    // Try array of errors
    if (Array.isArray(obj['errors']) && obj['errors'].length > 0) {
      return String(obj['errors'][0]);
    }

    return undefined;
  }
}
