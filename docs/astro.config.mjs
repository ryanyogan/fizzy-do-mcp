// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
  site: 'https://fizzy.yogan.dev',
  integrations: [
    starlight({
      title: 'Fizzy MCP',
      description: 'AI-powered task management with Model Context Protocol',
      logo: {
        light: './src/assets/fizzy-logo-light.svg',
        dark: './src/assets/fizzy-logo-dark.svg',
        replacesTitle: true,
      },
      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/fizzy-do/fizzy-mcp' },
        { icon: 'x.com', label: 'Twitter', href: 'https://x.com/fizzy' },
      ],
      customCss: ['./src/styles/fizzy-theme.css'],
      head: [
        {
          tag: 'meta',
          attrs: {
            name: 'theme-color',
            content: '#22d3ee',
          },
        },
      ],
      sidebar: [
        {
          label: 'Getting Started',
          items: [
            { label: 'Introduction', slug: 'getting-started/introduction' },
            { label: 'Installation', slug: 'getting-started/installation' },
            { label: 'Authentication', slug: 'getting-started/authentication' },
            { label: 'Quick Start', slug: 'getting-started/quickstart' },
          ],
        },
        {
          label: 'Configuration',
          items: [
            { label: 'Claude Desktop', slug: 'configuration/claude-desktop' },
            { label: 'Cursor', slug: 'configuration/cursor' },
            { label: 'OpenCode', slug: 'configuration/opencode' },
            { label: 'Environment Variables', slug: 'configuration/environment' },
          ],
        },
        {
          label: 'Tools Reference',
          items: [
            { label: 'Overview', slug: 'tools/overview' },
            {
              label: 'Identity',
              items: [
                { label: 'fizzy_get_identity', slug: 'tools/identity/get-identity' },
                { label: 'fizzy_get_account', slug: 'tools/identity/get-account' },
              ],
            },
            {
              label: 'Boards',
              items: [
                { label: 'fizzy_list_boards', slug: 'tools/boards/list-boards' },
                { label: 'fizzy_get_board', slug: 'tools/boards/get-board' },
                { label: 'fizzy_create_board', slug: 'tools/boards/create-board' },
                { label: 'fizzy_update_board', slug: 'tools/boards/update-board' },
                { label: 'fizzy_delete_board', slug: 'tools/boards/delete-board' },
                { label: 'fizzy_publish_board', slug: 'tools/boards/publish-board' },
                { label: 'fizzy_unpublish_board', slug: 'tools/boards/unpublish-board' },
              ],
            },
            {
              label: 'Cards',
              items: [
                { label: 'fizzy_list_cards', slug: 'tools/cards/list-cards' },
                { label: 'fizzy_get_card', slug: 'tools/cards/get-card' },
                { label: 'fizzy_create_card', slug: 'tools/cards/create-card' },
                { label: 'fizzy_update_card', slug: 'tools/cards/update-card' },
                { label: 'fizzy_delete_card', slug: 'tools/cards/delete-card' },
                { label: 'fizzy_close_card', slug: 'tools/cards/close-card' },
                { label: 'fizzy_reopen_card', slug: 'tools/cards/reopen-card' },
                { label: 'fizzy_postpone_card', slug: 'tools/cards/postpone-card' },
                { label: 'fizzy_triage_card', slug: 'tools/cards/triage-card' },
                { label: 'fizzy_untriage_card', slug: 'tools/cards/untriage-card' },
                { label: 'fizzy_tag_card', slug: 'tools/cards/tag-card' },
                { label: 'fizzy_assign_card', slug: 'tools/cards/assign-card' },
                { label: 'fizzy_watch_card', slug: 'tools/cards/watch-card' },
                { label: 'fizzy_unwatch_card', slug: 'tools/cards/unwatch-card' },
                { label: 'fizzy_pin_card', slug: 'tools/cards/pin-card' },
                { label: 'fizzy_unpin_card', slug: 'tools/cards/unpin-card' },
                { label: 'fizzy_mark_golden', slug: 'tools/cards/mark-golden' },
                { label: 'fizzy_unmark_golden', slug: 'tools/cards/unmark-golden' },
              ],
            },
            {
              label: 'Comments',
              items: [
                { label: 'fizzy_list_comments', slug: 'tools/comments/list-comments' },
                { label: 'fizzy_get_comment', slug: 'tools/comments/get-comment' },
                { label: 'fizzy_create_comment', slug: 'tools/comments/create-comment' },
                { label: 'fizzy_update_comment', slug: 'tools/comments/update-comment' },
                { label: 'fizzy_delete_comment', slug: 'tools/comments/delete-comment' },
              ],
            },
            {
              label: 'Columns',
              items: [
                { label: 'fizzy_list_columns', slug: 'tools/columns/list-columns' },
                { label: 'fizzy_get_column', slug: 'tools/columns/get-column' },
                { label: 'fizzy_create_column', slug: 'tools/columns/create-column' },
                { label: 'fizzy_update_column', slug: 'tools/columns/update-column' },
                { label: 'fizzy_delete_column', slug: 'tools/columns/delete-column' },
              ],
            },
            {
              label: 'Tags',
              items: [
                { label: 'fizzy_list_tags', slug: 'tools/tags/list-tags' },
              ],
            },
            {
              label: 'Users',
              items: [
                { label: 'fizzy_list_users', slug: 'tools/users/list-users' },
                { label: 'fizzy_get_user', slug: 'tools/users/get-user' },
              ],
            },
          ],
        },
        {
          label: 'Guides',
          items: [
            { label: 'Working with Boards', slug: 'guides/boards' },
            { label: 'Managing Cards', slug: 'guides/cards' },
            { label: 'Using Tags', slug: 'guides/tags' },
            { label: 'Team Collaboration', slug: 'guides/collaboration' },
          ],
        },
        {
          label: 'API Reference',
          items: [
            { label: 'TypeScript Client', slug: 'api/client' },
            { label: 'Error Handling', slug: 'api/errors' },
            { label: 'Result Type', slug: 'api/result' },
          ],
        },
      ],
    }),
  ],
});
