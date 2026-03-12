/**
 * A Result type for explicit error handling.
 *
 * Inspired by Rust's Result<T, E> type, this provides a way to handle
 * errors without exceptions, making error handling explicit and type-safe.
 *
 * @example
 * ```typescript
 * async function fetchUser(id: string): Promise<Result<User, ApiError>> {
 *   try {
 *     const user = await api.getUser(id);
 *     return Ok(user);
 *   } catch (error) {
 *     return Err(new ApiError('Failed to fetch user', error));
 *   }
 * }
 *
 * const result = await fetchUser('123');
 * if (result.ok) {
 *   console.log(result.value.name);
 * } else {
 *   console.error(result.error.message);
 * }
 * ```
 */
export type Result<T, E = Error> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };

/**
 * Creates a successful Result containing the given value.
 */
export function Ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

/**
 * Creates a failed Result containing the given error.
 */
export function Err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}

/**
 * Type guard to check if a Result is successful.
 */
export function isOk<T, E>(result: Result<T, E>): result is { ok: true; value: T } {
  return result.ok;
}

/**
 * Type guard to check if a Result is an error.
 */
export function isErr<T, E>(result: Result<T, E>): result is { ok: false; error: E } {
  return !result.ok;
}

/**
 * Unwraps a Result, returning the value if successful or throwing the error.
 * Use sparingly - prefer pattern matching with if/else.
 */
export function unwrap<T, E>(result: Result<T, E>): T {
  if (result.ok) {
    return result.value;
  }
  throw result.error;
}

/**
 * Unwraps a Result, returning the value if successful or the provided default.
 */
export function unwrapOr<T, E>(result: Result<T, E>, defaultValue: T): T {
  if (result.ok) {
    return result.value;
  }
  return defaultValue;
}

/**
 * Maps a Result<T, E> to Result<U, E> by applying a function to the success value.
 */
export function map<T, E, U>(result: Result<T, E>, fn: (value: T) => U): Result<U, E> {
  if (result.ok) {
    return Ok(fn(result.value));
  }
  return result;
}

/**
 * Maps a Result<T, E> to Result<T, F> by applying a function to the error value.
 */
export function mapErr<T, E, F>(result: Result<T, E>, fn: (error: E) => F): Result<T, F> {
  if (result.ok) {
    return result;
  }
  return Err(fn(result.error));
}

/**
 * Chains Result-returning functions together.
 * If the first Result is an error, returns it immediately.
 * Otherwise, applies the function to the value.
 */
export function andThen<T, E, U>(
  result: Result<T, E>,
  fn: (value: T) => Result<U, E>,
): Result<U, E> {
  if (result.ok) {
    return fn(result.value);
  }
  return result;
}

/**
 * Wraps a Promise that might throw into a Promise<Result>.
 */
export async function fromPromise<T, E = Error>(
  promise: Promise<T>,
  mapError?: (error: unknown) => E,
): Promise<Result<T, E>> {
  try {
    const value = await promise;
    return Ok(value);
  } catch (error) {
    if (mapError) {
      return Err(mapError(error));
    }
    return Err(error as E);
  }
}

/**
 * Wraps a function that might throw into a Result.
 */
export function fromTry<T, E = Error>(
  fn: () => T,
  mapError?: (error: unknown) => E,
): Result<T, E> {
  try {
    const value = fn();
    return Ok(value);
  } catch (error) {
    if (mapError) {
      return Err(mapError(error));
    }
    return Err(error as E);
  }
}
