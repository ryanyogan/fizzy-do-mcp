import { marked } from 'marked';

/**
 * Convert markdown to HTML for Fizzy rich text fields.
 *
 * Fizzy uses ActionText which sanitizes HTML server-side,
 * so we just need to convert markdown to standard HTML.
 *
 * Supported markdown features:
 * - **bold** and _italic_ text
 * - [links](url)
 * - # Headings (h1-h6)
 * - Unordered lists (- item)
 * - Ordered lists (1. item)
 * - > Blockquotes
 * - `inline code` and ```code blocks```
 * - ~~strikethrough~~
 *
 * @example
 * ```ts
 * const html = markdownToHtml('**Bold** and _italic_');
 * // Returns: '<p><strong>Bold</strong> and <em>italic</em></p>\n'
 * ```
 */
export function markdownToHtml(markdown: string): string {
  if (!markdown) return '';
  return marked.parse(markdown, { async: false }) as string;
}

/**
 * Check if a string contains HTML tags.
 *
 * This is a simple heuristic check - it looks for opening HTML tags
 * like `<p>`, `<div>`, `<strong>`, etc.
 *
 * @example
 * ```ts
 * isHtml('<p>Hello</p>');     // true
 * isHtml('**Hello**');        // false
 * isHtml('Hello <b>world</b>'); // true
 * ```
 */
export function isHtml(text: string): boolean {
  if (!text) return false;
  return /<[a-z][\s\S]*>/i.test(text);
}

/**
 * Smart converter: pass through HTML, convert markdown/plain text to HTML.
 *
 * Use this in tool handlers to accept either markdown or HTML input.
 * If the input already contains HTML tags, it's passed through unchanged.
 * Otherwise, it's treated as markdown and converted to HTML.
 *
 * @example
 * ```ts
 * // Markdown input - gets converted
 * toRichText('**Bold** text');
 * // Returns: '<p><strong>Bold</strong> text</p>\n'
 *
 * // HTML input - passed through
 * toRichText('<p><strong>Bold</strong> text</p>');
 * // Returns: '<p><strong>Bold</strong> text</p>'
 * ```
 */
export function toRichText(input: string): string {
  if (!input) return '';
  if (isHtml(input)) return input;
  return markdownToHtml(input);
}
