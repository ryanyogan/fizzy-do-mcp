import { defineConfig } from 'vitepress';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Read version from the main CLI package
const serverPackageJson = JSON.parse(
  readFileSync(resolve(__dirname, '../../apps/server/package.json'), 'utf-8'),
);
const version = serverPackageJson.version;

export default defineConfig({
  title: 'Fizzy Do',
  description: 'AI-powered project management with Model Context Protocol',

  head: [
    ['meta', { name: 'theme-color', content: '#000000' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.googleapis.com' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' }],
    [
      'link',
      {
        href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
        rel: 'stylesheet',
      },
    ],
    [
      'link',
      {
        href: 'https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400;500;600&display=swap',
        rel: 'stylesheet',
      },
    ],
  ],

  cleanUrls: true,

  themeConfig: {
    logo: '/logo.svg',

    nav: [
      { text: 'Docs', link: '/getting-started/introduction' },
      { text: 'Tools', link: '/tools/overview' },
      { text: 'Workflows', link: '/workflows/ai-driven-tasks' },
      {
        text: `v${version}`,
        items: [
          {
            text: 'Changelog',
            link: 'https://github.com/ryanyogan/fizzy-do-mcp/blob/main/CHANGELOG.md',
          },
          {
            text: 'npm',
            link: 'https://www.npmjs.com/package/fizzy-do-mcp',
          },
        ],
      },
      { text: 'GitHub', link: 'https://github.com/ryanyogan/fizzy-do-mcp' },
    ],

    sidebar: [
      {
        text: 'Getting Started',
        collapsed: true,
        items: [
          { text: 'Introduction', link: '/getting-started/introduction' },
          { text: 'Installation', link: '/getting-started/installation' },
          { text: 'Quick Start', link: '/getting-started/quickstart' },
        ],
      },
      {
        text: 'Configuration',
        collapsed: true,
        items: [
          { text: 'Claude Desktop', link: '/configuration/claude-desktop' },
          { text: 'Claude Code', link: '/configuration/claude-code' },
          { text: 'Cursor', link: '/configuration/cursor' },
          { text: 'OpenCode', link: '/configuration/opencode' },
          { text: 'Windsurf', link: '/configuration/windsurf' },
          { text: 'Continue', link: '/configuration/continue' },
          { text: 'Environment Variables', link: '/configuration/environment' },
        ],
      },
      {
        text: 'Workflows',
        collapsed: true,
        items: [
          { text: 'AI-Driven Tasks', link: '/workflows/ai-driven-tasks' },
          { text: 'Project Management', link: '/workflows/project-management' },
          { text: 'Team Collaboration', link: '/workflows/team-collaboration' },
        ],
      },
      {
        text: 'Tools Reference',
        collapsed: true,
        items: [
          { text: 'Overview', link: '/tools/overview' },
          {
            text: 'Identity',
            collapsed: true,
            items: [
              { text: 'fizzy_get_identity', link: '/tools/identity/get-identity' },
              { text: 'fizzy_get_account', link: '/tools/identity/get-account' },
            ],
          },
          {
            text: 'Boards',
            collapsed: true,
            items: [
              { text: 'fizzy_list_boards', link: '/tools/boards/list-boards' },
              { text: 'fizzy_get_board', link: '/tools/boards/get-board' },
              { text: 'fizzy_create_board', link: '/tools/boards/create-board' },
              { text: 'fizzy_update_board', link: '/tools/boards/update-board' },
              { text: 'fizzy_delete_board', link: '/tools/boards/delete-board' },
              { text: 'fizzy_publish_board', link: '/tools/boards/publish-board' },
              { text: 'fizzy_unpublish_board', link: '/tools/boards/unpublish-board' },
            ],
          },
          {
            text: 'Cards',
            collapsed: true,
            items: [
              { text: 'fizzy_list_cards', link: '/tools/cards/list-cards' },
              { text: 'fizzy_get_card', link: '/tools/cards/get-card' },
              { text: 'fizzy_create_card', link: '/tools/cards/create-card' },
              { text: 'fizzy_update_card', link: '/tools/cards/update-card' },
              { text: 'fizzy_delete_card', link: '/tools/cards/delete-card' },
              { text: 'fizzy_close_card', link: '/tools/cards/close-card' },
              { text: 'fizzy_reopen_card', link: '/tools/cards/reopen-card' },
              { text: 'fizzy_postpone_card', link: '/tools/cards/postpone-card' },
              { text: 'fizzy_triage_card', link: '/tools/cards/triage-card' },
              { text: 'fizzy_untriage_card', link: '/tools/cards/untriage-card' },
              { text: 'fizzy_tag_card', link: '/tools/cards/tag-card' },
              { text: 'fizzy_assign_card', link: '/tools/cards/assign-card' },
              { text: 'fizzy_watch_card', link: '/tools/cards/watch-card' },
              { text: 'fizzy_unwatch_card', link: '/tools/cards/unwatch-card' },
              { text: 'fizzy_pin_card', link: '/tools/cards/pin-card' },
              { text: 'fizzy_unpin_card', link: '/tools/cards/unpin-card' },
              { text: 'fizzy_mark_golden', link: '/tools/cards/mark-golden' },
              { text: 'fizzy_unmark_golden', link: '/tools/cards/unmark-golden' },
            ],
          },
          {
            text: 'Comments',
            collapsed: true,
            items: [
              { text: 'fizzy_list_comments', link: '/tools/comments/list-comments' },
              { text: 'fizzy_get_comment', link: '/tools/comments/get-comment' },
              { text: 'fizzy_create_comment', link: '/tools/comments/create-comment' },
              { text: 'fizzy_update_comment', link: '/tools/comments/update-comment' },
              { text: 'fizzy_delete_comment', link: '/tools/comments/delete-comment' },
            ],
          },
          {
            text: 'Columns',
            collapsed: true,
            items: [
              { text: 'fizzy_list_columns', link: '/tools/columns/list-columns' },
              { text: 'fizzy_get_column', link: '/tools/columns/get-column' },
              { text: 'fizzy_create_column', link: '/tools/columns/create-column' },
              { text: 'fizzy_update_column', link: '/tools/columns/update-column' },
              { text: 'fizzy_delete_column', link: '/tools/columns/delete-column' },
            ],
          },
          {
            text: 'Tags',
            collapsed: true,
            items: [{ text: 'fizzy_list_tags', link: '/tools/tags/list-tags' }],
          },
          {
            text: 'Users',
            collapsed: true,
            items: [
              { text: 'fizzy_list_users', link: '/tools/users/list-users' },
              { text: 'fizzy_get_user', link: '/tools/users/get-user' },
            ],
          },
        ],
      },
      {
        text: 'API Reference',
        collapsed: true,
        items: [
          { text: 'TypeScript Client', link: '/api/client' },
          { text: 'Error Handling', link: '/api/errors' },
          { text: 'Result Type', link: '/api/result' },
          { text: 'CLI Reference', link: '/api/cli' },
        ],
      },
    ],

    socialLinks: [{ icon: 'github', link: 'https://github.com/ryanyogan/fizzy-do-mcp' }],

    search: {
      provider: 'local',
      options: {
        detailedView: true,
      },
    },

    editLink: {
      pattern: 'https://github.com/ryanyogan/fizzy-do-mcp/edit/main/docs/:path',
      text: 'Edit this page on GitHub',
    },

    footer: {
      message: 'Open source under MIT License',
      copyright: 'Built by Ryan Yogan',
    },
  },
});
