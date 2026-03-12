/**
 * HTTP client module for the Fizzy API.
 *
 * @module @fizzy-mcp/client/http
 */

export type { HttpClient, HttpClientConfig, HttpRequestConfig, HttpResponse } from './types.js';

export { FetchHttpClient } from './fetch-client.js';

export { withRetry, DEFAULT_RETRY_CONFIG, type RetryConfig } from './retry.js';
