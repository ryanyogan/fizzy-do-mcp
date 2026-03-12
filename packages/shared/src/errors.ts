/**
 * Base class for all Fizzy-related errors.
 *
 * Provides a consistent error structure with:
 * - A unique error code for programmatic handling
 * - A flag indicating if the operation can be retried
 * - Proper Error inheritance with stack traces
 */
export abstract class FizzyError extends Error {
  /**
   * Unique error code for programmatic handling.
   */
  abstract readonly code: string;

  /**
   * Whether this error is retryable (e.g., network timeouts, rate limits).
   */
  abstract readonly retryable: boolean;

  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;

    // Maintains proper stack trace for where our error was thrown (V8 engines)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Returns a JSON-serializable representation of the error.
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      retryable: this.retryable,
    };
  }
}

/**
 * Error thrown when an API request fails.
 *
 * Contains the HTTP status code and any validation details from the server.
 */
export class FizzyApiError extends FizzyError {
  readonly code = 'API_ERROR';
  readonly retryable: boolean;

  constructor(
    message: string,
    readonly status: number,
    readonly details?: Record<string, string[]>,
    readonly retryAfter?: number,
  ) {
    super(message);
    // 5xx errors and rate limits are retryable
    this.retryable = status >= 500 || status === 429;
  }

  override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      status: this.status,
      details: this.details,
      retryAfter: this.retryAfter,
    };
  }
}

/**
 * Error thrown when authentication fails.
 *
 * This typically means the access token is invalid, expired, or missing.
 */
export class FizzyAuthError extends FizzyError {
  readonly code = 'AUTH_ERROR';
  readonly retryable = false;

  constructor(message = 'Authentication failed. Check your access token.') {
    super(message);
  }
}

/**
 * Error thrown when the user doesn't have permission to perform an action.
 */
export class FizzyForbiddenError extends FizzyError {
  readonly code = 'FORBIDDEN_ERROR';
  readonly retryable = false;

  constructor(message = 'You do not have permission to perform this action.') {
    super(message);
  }
}

/**
 * Error thrown when a requested resource is not found.
 */
export class FizzyNotFoundError extends FizzyError {
  readonly code = 'NOT_FOUND_ERROR';
  readonly retryable = false;

  constructor(
    message = 'The requested resource was not found.',
    readonly resourceType?: string,
    readonly resourceId?: string,
  ) {
    super(message);
  }

  override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      resourceType: this.resourceType,
      resourceId: this.resourceId,
    };
  }
}

/**
 * Error thrown when request validation fails.
 *
 * This can occur either from Zod schema validation locally
 * or from the Fizzy API returning 422 Unprocessable Entity.
 */
export class FizzyValidationError extends FizzyError {
  readonly code = 'VALIDATION_ERROR';
  readonly retryable = false;

  constructor(
    message: string,
    readonly issues: ValidationIssue[],
  ) {
    super(message);
  }

  override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      issues: this.issues,
    };
  }
}

/**
 * Represents a single validation issue.
 */
export interface ValidationIssue {
  /** The field path that failed validation */
  path: (string | number)[];
  /** The validation error message */
  message: string;
  /** The validation error code */
  code?: string;
}

/**
 * Error thrown when a network request fails.
 *
 * This includes DNS failures, connection timeouts, and other network-level errors.
 */
export class FizzyNetworkError extends FizzyError {
  readonly code = 'NETWORK_ERROR';
  readonly retryable = true;

  constructor(
    message = 'Network request failed.',
    readonly cause?: Error,
  ) {
    super(message);
  }

  override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      cause: this.cause?.message,
    };
  }
}

/**
 * Error thrown when configuration is invalid or missing.
 */
export class FizzyConfigError extends FizzyError {
  readonly code = 'CONFIG_ERROR';
  readonly retryable = false;

  constructor(message: string) {
    super(message);
  }
}

/**
 * Error thrown when rate limited by the Fizzy API.
 */
export class FizzyRateLimitError extends FizzyError {
  readonly code = 'RATE_LIMIT_ERROR';
  readonly retryable = true;

  constructor(
    message = 'Rate limit exceeded. Please slow down your requests.',
    readonly retryAfter?: number,
  ) {
    super(message);
  }

  override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      retryAfter: this.retryAfter,
    };
  }
}

/**
 * Converts an unknown error to a FizzyError.
 * Useful for catch blocks where error type is unknown.
 */
export function toFizzyError(error: unknown): FizzyError {
  if (error instanceof FizzyError) {
    return error;
  }

  if (error instanceof Error) {
    return new FizzyNetworkError(error.message, error);
  }

  return new FizzyNetworkError(String(error));
}
