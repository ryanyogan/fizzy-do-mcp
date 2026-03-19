/**
 * PR documentation generator for Vibe Mode.
 *
 * Generates high-quality pull request documentation including
 * summary, changed files, architecture diagrams, and context.
 *
 * @module vibe/pr-template
 */

import type { CardWorkItem, VibeConfig } from '@fizzy-do-mcp/shared';

/**
 * Options for generating PR body.
 */
export interface PRBodyOptions {
  /** The card being worked on */
  card: CardWorkItem;

  /** Board's vibe configuration */
  config: VibeConfig;

  /** Summary of what was accomplished */
  summary: string;

  /** List of changed files */
  changedFiles: string[];

  /** Optional diff content (for more detailed analysis) */
  diff?: string;

  /** Optional additional context from AI */
  additionalContext?: string;
}

/**
 * Template level from config.
 */
export type PRTemplateLevel = 'minimal' | 'default' | 'detailed';

/**
 * Generates the PR body based on the template level and options.
 *
 * @param options - Options for generating the PR body
 * @returns Formatted PR body in markdown
 *
 * @example
 * ```typescript
 * const body = generatePRBody({
 *   card: { number: 123, title: 'Fix login bug', ... },
 *   config: { repository: '...', pr_template: 'default', ... },
 *   summary: 'Fixed the login validation issue',
 *   changedFiles: ['src/auth/login.ts', 'src/auth/validation.ts'],
 * });
 * ```
 */
export function generatePRBody(options: PRBodyOptions): string {
  const { card, config, summary, changedFiles, additionalContext } = options;
  const level = config.pr_template;

  const sections: string[] = [];

  // Summary section (always included)
  sections.push(generateSummarySection(summary, card));

  // Fizzy card link (always included)
  sections.push(generateCardLinkSection(card));

  // What Changed section
  if (level !== 'minimal' && changedFiles.length > 0) {
    sections.push(generateChangedFilesSection(changedFiles, level));
  }

  // Steps from card (if present and not minimal)
  if (level !== 'minimal' && card.steps.length > 0) {
    sections.push(generateStepsSection(card.steps));
  }

  // Architecture diagram (detailed only)
  if (level === 'detailed' && changedFiles.length > 1) {
    sections.push(generateArchitectureSection(changedFiles));
  }

  // Additional context (if provided)
  if (additionalContext) {
    sections.push(generateContextSection(additionalContext));
  }

  // Testing notes (default and detailed)
  if (level !== 'minimal') {
    sections.push(generateTestingSection());
  }

  // Footer
  sections.push(generateFooter());

  return sections.join('\n\n');
}

/**
 * Generates the summary section.
 */
function generateSummarySection(summary: string, card: CardWorkItem): string {
  const lines = ['## Summary', '', summary];

  if (card.description) {
    // Add a brief context from the card description
    const plainDescription = stripHtml(card.description).slice(0, 200);
    if (plainDescription.length > 0) {
      lines.push('', `> ${plainDescription}${card.description.length > 200 ? '...' : ''}`);
    }
  }

  return lines.join('\n');
}

/**
 * Generates the card link section.
 */
function generateCardLinkSection(card: CardWorkItem): string {
  return [
    '## Fizzy Card',
    '',
    `- **Card:** #${card.number}`,
    `- **Title:** ${card.title}`,
    `- **Board:** ${card.board_name}`,
  ].join('\n');
}

/**
 * Generates the changed files section.
 */
function generateChangedFilesSection(changedFiles: string[], level: PRTemplateLevel): string {
  const lines = ['## What Changed', ''];

  // Group files by directory
  const filesByDir = groupFilesByDirectory(changedFiles);

  if (level === 'detailed') {
    // Detailed: show files with descriptions
    for (const [dir, files] of Object.entries(filesByDir)) {
      lines.push(`### \`${dir}/\``);
      for (const file of files) {
        const description = inferFileDescription(file);
        lines.push(`- \`${file}\`${description ? ` - ${description}` : ''}`);
      }
      lines.push('');
    }
  } else {
    // Default: simple file list
    for (const file of changedFiles) {
      lines.push(`- \`${file}\``);
    }
  }

  return lines.join('\n');
}

/**
 * Generates the steps section from card checklist.
 */
function generateStepsSection(
  steps: Array<{ id: string; content: string; completed: boolean }>,
): string {
  const lines = ['## Implementation Steps', ''];

  for (const step of steps) {
    const checkbox = step.completed ? '[x]' : '[ ]';
    lines.push(`- ${checkbox} ${step.content}`);
  }

  return lines.join('\n');
}

/**
 * Generates a simple architecture diagram using Mermaid.
 */
function generateArchitectureSection(changedFiles: string[]): string {
  // Create a simple file relationship diagram
  const filesByDir = groupFilesByDirectory(changedFiles);
  const dirs = Object.keys(filesByDir);

  const lines = ['## Architecture', '', '```mermaid', 'flowchart TD'];

  // Create nodes for each directory
  for (const dir of dirs) {
    const files = filesByDir[dir]!;
    const nodeId = dir.replace(/[^a-zA-Z0-9]/g, '_');
    const fileList = files.slice(0, 3).join(', ') + (files.length > 3 ? '...' : '');
    lines.push(`    ${nodeId}["${dir}/<br/>${fileList}"]`);
  }

  // Create simple connections if there are related directories
  if (dirs.length > 1) {
    lines.push(`    ${dirs[0]!.replace(/[^a-zA-Z0-9]/g, '_')} --> Changes`);
    lines.push('    Changes["This PR"]');
  }

  lines.push('```');

  return lines.join('\n');
}

/**
 * Generates the context section.
 */
function generateContextSection(context: string): string {
  return ['## Why These Changes', '', context].join('\n');
}

/**
 * Generates the testing section.
 */
function generateTestingSection(): string {
  return [
    '## Testing',
    '',
    '- [ ] Automated tests pass',
    '- [ ] Manual testing completed',
    '- [ ] Changes reviewed for regressions',
  ].join('\n');
}

/**
 * Generates the footer.
 */
function generateFooter(): string {
  return [
    '---',
    '',
    '*Generated by [Fizzy Do AI](https://app.fizzy.do) - Autonomous project management for developers*',
  ].join('\n');
}

/**
 * Groups files by their directory.
 */
function groupFilesByDirectory(files: string[]): Record<string, string[]> {
  const result: Record<string, string[]> = {};

  for (const file of files) {
    const parts = file.split('/');
    const dir = parts.length > 1 ? parts.slice(0, -1).join('/') : '.';
    const filename = parts[parts.length - 1]!;

    if (!result[dir]) {
      result[dir] = [];
    }
    result[dir].push(filename);
  }

  return result;
}

/**
 * Infers a description for a file based on its name and path.
 */
function inferFileDescription(filename: string): string | null {
  const name = filename.toLowerCase();

  // Test files
  if (name.includes('.test.') || name.includes('.spec.')) {
    return 'Test file';
  }

  // Configuration files
  if (name.endsWith('.config.ts') || name.endsWith('.config.js')) {
    return 'Configuration';
  }

  // Type definitions
  if (name.endsWith('.d.ts')) {
    return 'Type definitions';
  }

  // Index files
  if (name.startsWith('index.')) {
    return 'Module exports';
  }

  // Common patterns
  if (name.includes('util') || name.includes('helper')) {
    return 'Utility functions';
  }
  if (name.includes('hook')) {
    return 'React hook';
  }
  if (name.includes('component')) {
    return 'UI component';
  }
  if (name.includes('service')) {
    return 'Service layer';
  }
  if (name.includes('api')) {
    return 'API layer';
  }

  return null;
}

/**
 * Strips HTML tags from a string.
 */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&nbsp;/g, ' ') // Replace &nbsp;
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

/**
 * Generates a PR title from the card.
 *
 * @param card - The card being worked on
 * @returns Formatted PR title
 */
export function generatePRTitle(card: CardWorkItem): string {
  // Add card reference to title
  return `${card.title} (#${card.number})`;
}
