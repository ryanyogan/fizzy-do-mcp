import { Result, Ok, Err, FizzyError, toFizzyError } from '@fizzy-mcp/shared';
import type { HttpClient } from '../http/types.js';
import type { ZodType } from 'zod';

/**
 * Context shared by all endpoint classes.
 */
export interface EndpointContext {
  /** HTTP client for making requests */
  http: HttpClient;

  /** Account slug (e.g., "/897362094") */
  accountSlug: string;
}

/**
 * Base class for API endpoint modules.
 *
 * Provides common functionality for making typed API requests
 * with Zod schema validation.
 */
export abstract class BaseEndpoint {
  protected readonly http: HttpClient;
  protected readonly accountSlug: string;

  constructor(context: EndpointContext) {
    this.http = context.http;
    this.accountSlug = context.accountSlug;
  }

  /**
   * Makes a GET request and validates the response with a Zod schema.
   */
  protected async get<T>(
    path: string,
    schema: ZodType<T>,
    params?: Record<string, string | string[] | undefined>,
  ): Promise<Result<T, FizzyError>> {
    try {
      const response = await this.http.request<unknown>({
        method: 'GET',
        path: this.buildPath(path),
        ...(params !== undefined && { params }),
      });

      const parsed = schema.parse(response.data);
      return Ok(parsed);
    } catch (error) {
      return Err(toFizzyError(error));
    }
  }

  /**
   * Makes a POST request and validates the response with a Zod schema.
   */
  protected async post<T>(
    path: string,
    schema: ZodType<T>,
    body?: unknown,
  ): Promise<Result<T, FizzyError>> {
    try {
      const response = await this.http.request<unknown>({
        method: 'POST',
        path: this.buildPath(path),
        body,
      });

      const parsed = schema.parse(response.data);
      return Ok(parsed);
    } catch (error) {
      return Err(toFizzyError(error));
    }
  }

  /**
   * Makes a POST request that returns no content (204).
   */
  protected async postNoContent(path: string, body?: unknown): Promise<Result<void, FizzyError>> {
    try {
      await this.http.request<unknown>({
        method: 'POST',
        path: this.buildPath(path),
        body,
      });

      return Ok(undefined);
    } catch (error) {
      return Err(toFizzyError(error));
    }
  }

  /**
   * Makes a PUT request and validates the response with a Zod schema.
   */
  protected async put<T>(
    path: string,
    schema: ZodType<T>,
    body?: unknown,
  ): Promise<Result<T, FizzyError>> {
    try {
      const response = await this.http.request<unknown>({
        method: 'PUT',
        path: this.buildPath(path),
        body,
      });

      const parsed = schema.parse(response.data);
      return Ok(parsed);
    } catch (error) {
      return Err(toFizzyError(error));
    }
  }

  /**
   * Makes a PUT request that returns no content (204).
   */
  protected async putNoContent(path: string, body?: unknown): Promise<Result<void, FizzyError>> {
    try {
      await this.http.request<unknown>({
        method: 'PUT',
        path: this.buildPath(path),
        body,
      });

      return Ok(undefined);
    } catch (error) {
      return Err(toFizzyError(error));
    }
  }

  /**
   * Makes a PATCH request and validates the response with a Zod schema.
   */
  protected async patch<T>(
    path: string,
    schema: ZodType<T>,
    body?: unknown,
  ): Promise<Result<T, FizzyError>> {
    try {
      const response = await this.http.request<unknown>({
        method: 'PATCH',
        path: this.buildPath(path),
        body,
      });

      const parsed = schema.parse(response.data);
      return Ok(parsed);
    } catch (error) {
      return Err(toFizzyError(error));
    }
  }

  /**
   * Makes a DELETE request that returns no content (204).
   */
  protected async delete(path: string): Promise<Result<void, FizzyError>> {
    try {
      await this.http.request<unknown>({
        method: 'DELETE',
        path: this.buildPath(path),
      });

      return Ok(undefined);
    } catch (error) {
      return Err(toFizzyError(error));
    }
  }

  /**
   * Builds the full API path including account slug.
   * Override this in endpoints that don't need the account slug.
   */
  protected buildPath(path: string): string {
    // Remove leading slash from path if present
    const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
    return `${this.accountSlug}/${normalizedPath}`;
  }
}

/**
 * Base class for endpoints that don't require account slug.
 */
export abstract class GlobalEndpoint extends BaseEndpoint {
  protected override buildPath(path: string): string {
    return path.startsWith('/') ? path : `/${path}`;
  }
}
