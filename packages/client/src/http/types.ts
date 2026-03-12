/**
 * HTTP client abstraction for dependency injection.
 *
 * This allows swapping out the HTTP implementation for testing
 * or for different runtime environments (Node.js, Cloudflare Workers, etc.).
 */

/**
 * HTTP request configuration.
 */
export interface HttpRequestConfig {
  /** HTTP method */
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

  /** URL path (relative to base URL) */
  path: string;

  /** Request headers (merged with default headers) */
  headers?: Record<string, string>;

  /** Request body (will be JSON-serialized) */
  body?: unknown;

  /** Query parameters */
  params?: Record<string, string | string[] | undefined>;

  /** Request timeout in milliseconds */
  timeout?: number;
}

/**
 * HTTP response wrapper.
 */
export interface HttpResponse<T> {
  /** Response data (parsed JSON) */
  data: T;

  /** HTTP status code */
  status: number;

  /** Response headers */
  headers: Headers;
}

/**
 * HTTP client interface for making requests.
 */
export interface HttpClient {
  /**
   * Makes an HTTP request and returns the response.
   *
   * @param config - Request configuration
   * @returns Promise resolving to the response
   * @throws {FizzyApiError} When the API returns an error status
   * @throws {FizzyNetworkError} When the request fails at the network level
   */
  request<T>(config: HttpRequestConfig): Promise<HttpResponse<T>>;
}

/**
 * Configuration for the HTTP client.
 */
export interface HttpClientConfig {
  /** Base URL for all requests (e.g., "https://app.fizzy.do") */
  baseUrl: string;

  /** Default headers to include in all requests */
  headers?: Record<string, string>;

  /** Default timeout in milliseconds */
  timeout?: number;
}
