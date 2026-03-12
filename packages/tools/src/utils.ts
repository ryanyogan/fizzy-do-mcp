import { FizzyError } from '@fizzy-mcp/shared';

/**
 * Content type for MCP tool responses.
 */
export interface TextContent {
  type: 'text';
  text: string;
}

/**
 * Result returned by MCP tools.
 *
 * The index signature is required for compatibility with the MCP SDK's
 * CallToolResult type which uses `[key: string]: unknown`.
 */
export interface ToolResult {
  [key: string]: unknown;
  content: TextContent[];
  isError?: boolean;
}

/**
 * Formats a successful tool result with optional summary.
 *
 * @param data - The data to include in the response
 * @param summary - Optional summary message to prepend
 */
export function formatToolSuccess<T>(data: T, summary?: string): ToolResult {
  const parts: string[] = [];

  if (summary) {
    parts.push(summary);
    parts.push('');
  }

  parts.push(JSON.stringify(data, null, 2));

  return {
    content: [{ type: 'text', text: parts.join('\n') }],
  };
}

/**
 * Formats an error result for MCP tools.
 *
 * @param error - The error that occurred
 */
export function formatToolError(error: FizzyError): ToolResult {
  const message = [
    `Error: ${error.message}`,
    `Code: ${error.code}`,
    error.retryable ? 'This error may be retryable.' : '',
  ]
    .filter(Boolean)
    .join('\n');

  return {
    content: [{ type: 'text', text: message }],
    isError: true,
  };
}

/**
 * Wraps an async operation and returns a formatted tool result.
 *
 * @param operation - Async function that returns a Result
 * @param successMessage - Optional message to include on success
 */
export async function wrapToolOperation<T>(
  operation: () => Promise<{ ok: true; value: T } | { ok: false; error: FizzyError }>,
  successMessage?: string | ((value: T) => string),
): Promise<ToolResult> {
  const result = await operation();

  if (!result.ok) {
    return formatToolError(result.error);
  }

  const message =
    typeof successMessage === 'function' ? successMessage(result.value) : successMessage;

  return formatToolSuccess(result.value, message);
}
