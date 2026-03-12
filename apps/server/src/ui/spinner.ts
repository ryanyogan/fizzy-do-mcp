/**
 * Spinner utilities for the Fizzy MCP CLI.
 *
 * Provides a consistent loading spinner experience with Fizzy branding.
 */

import ora, { type Ora } from 'ora';
import { colors } from './branding.js';

/**
 * Fizzy-branded spinner configuration.
 */
const SPINNER_CONFIG = {
  spinner: 'dots' as const,
  color: 'cyan' as const,
};

/**
 * Creates a new spinner with Fizzy branding.
 *
 * @param text - Initial spinner text
 * @returns Ora spinner instance
 *
 * @example
 * ```typescript
 * const spinner = createSpinner('Validating token...');
 * spinner.start();
 * // ... do work
 * spinner.succeed('Token validated');
 * ```
 */
export function createSpinner(text: string): Ora {
  return ora({
    text,
    ...SPINNER_CONFIG,
  });
}

/**
 * Runs an async operation with a loading spinner.
 *
 * @param text - Text to show while loading
 * @param operation - Async operation to run
 * @param options - Optional success/failure messages
 * @returns The result of the operation
 *
 * @example
 * ```typescript
 * const result = await withSpinner(
 *   'Fetching account...',
 *   () => client.account.getSettings(),
 *   { success: 'Account loaded', failure: 'Failed to load account' }
 * );
 * ```
 */
export async function withSpinner<T>(
  text: string,
  operation: () => Promise<T>,
  options?: {
    success?: string | ((result: T) => string);
    failure?: string | ((error: Error) => string);
  },
): Promise<T> {
  const spinner = createSpinner(text);
  spinner.start();

  try {
    const result = await operation();
    const successText =
      typeof options?.success === 'function' ? options.success(result) : options?.success;
    if (successText) {
      spinner.succeed(colors.success(successText));
    } else {
      spinner.stop();
    }
    return result;
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    const failureText =
      typeof options?.failure === 'function' ? options.failure(err) : options?.failure;
    spinner.fail(colors.error(failureText || err.message));
    throw error;
  }
}

/**
 * Shows a quick success message without a spinner.
 */
export function showSuccess(text: string): void {
  const spinner = createSpinner(text);
  spinner.succeed(colors.success(text));
}

/**
 * Shows a quick failure message without a spinner.
 */
export function showFailure(text: string): void {
  const spinner = createSpinner(text);
  spinner.fail(colors.error(text));
}

/**
 * Shows a quick info message without a spinner.
 */
export function showInfo(text: string): void {
  const spinner = createSpinner(text);
  spinner.info(colors.primary(text));
}

/**
 * Shows a quick warning message without a spinner.
 */
export function showWarning(text: string): void {
  const spinner = createSpinner(text);
  spinner.warn(colors.warning(text));
}
