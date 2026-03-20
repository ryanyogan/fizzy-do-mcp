# Fizzy Do MCP

<p align="center">
  <img src="docs/public/logo.svg" width="120" alt="Fizzy Do MCP Logo">
</p>

<p align="center">
  <strong>AI-Native Task Management with Model Context Protocol</strong>
</p>

<p align="center">
  Connect your AI assistant to <a href="https://fizzy.do">Fizzy</a> for intelligent, context-aware project management.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/fizzy-do-mcp"><img src="https://img.shields.io/npm/v/fizzy-do-mcp.svg" alt="npm version"></a>
  <a href="https://github.com/ryanyogan/fizzy-do-mcp/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/fizzy-do-mcp.svg" alt="license"></a>
</p>

<p align="center">
  <a href="https://fizzy.yogan.dev">Documentation</a> •
  <a href="https://fizzy.yogan.dev/getting-started/installation">Quick Start</a> •
  <a href="https://github.com/ryanyogan/fizzy-do-mcp/issues">Issues</a>
</p>

---

## What is Fizzy Do MCP?

Fizzy Do MCP is a **free, open-source** [Model Context Protocol](https://modelcontextprotocol.io) server that enables AI assistants to interact with [Fizzy](https://fizzy.do), Basecamp's task management tool.

**No limits. No subscriptions. Just connect and go.**

With Fizzy Do MCP, your AI can:

- **Read your boards and cards** - Get full context about your projects
- **Create and update cards** - Add tasks, modify descriptions, tags, and status
- **Move cards through workflows** - Triage to columns, postpone, or close them
- **Add comments and reactions** - Leave notes, updates, and emoji reactions
- **Manage columns, tags, and steps** - Organize your workflow with checklists
- **Project manager tools** - AI-powered workflows to track and report progress

## Quick Start

### Option 1: Local Server (Recommended)

Run the interactive setup wizard:

```bash
npx fizzy-do-mcp configure
```

The wizard will:
1. Detect your installed editors (Claude Desktop, Cursor, Claude Code, etc.)
2. Prompt for your Fizzy API token
3. Configure each editor automatically

**Or configure manually:**

Add to your editor's MCP configuration:

```json
{
  "mcpServers": {
    "fizzy": {
      "command": "npx",
      "args": ["-y", "fizzy-do-mcp"],
      "env": {
        "FIZZY_TOKEN": "your-fizzy-api-token"
      }
    }
  }
}
```

> **Tip:** You can also use the `fdm` alias: `npx fdm configure`

## Supported Editors

| Editor | Status | Configuration |
|--------|--------|---------------|
| Claude Desktop | ✅ Full support | [Guide](https://fizzy.yogan.dev/configuration/claude-desktop) |
| Claude Code | ✅ Full support | [Guide](https://fizzy.yogan.dev/configuration/claude-code) |
| Cursor | ✅ Full support | [Guide](https://fizzy.yogan.dev/configuration/cursor) |
| OpenCode | ✅ Full support | [Guide](https://fizzy.yogan.dev/configuration/opencode) |
| Windsurf | ✅ Full support | [Guide](https://fizzy.yogan.dev/configuration/windsurf) |
| Continue | ✅ Full support | [Guide](https://fizzy.yogan.dev/configuration/continue) |

## Example Usage

```
You: What's on my Engineering board?

AI: I found 12 open cards on your Engineering board:

In Progress:
- #234 "Implement user authentication" (assigned to you)
- #235 "API rate limiting"

Needs Triage:
- #240 "Database migration script"
- #241 "Update dependencies"

You: Create a card for adding dark mode support

AI: Created card #242 "Add dark mode support" on the Engineering board.
    Would you like me to add any tags or assign it to someone?
```

## Available Tools

Fizzy Do MCP provides 70+ tools covering all major Fizzy operations:

| Category | Tools |
|----------|-------|
| **Identity** | `fizzy_get_identity`, `fizzy_get_account` |
| **Boards** | `fizzy_list_boards`, `fizzy_get_board`, `fizzy_create_board`, `fizzy_update_board`, `fizzy_delete_board`, `fizzy_publish_board`, `fizzy_unpublish_board` |
| **Cards** | `fizzy_list_cards`, `fizzy_get_card`, `fizzy_create_card`, `fizzy_update_card`, `fizzy_delete_card`, `fizzy_close_card`, `fizzy_reopen_card`, `fizzy_postpone_card`, `fizzy_triage_card`, `fizzy_untriage_card`, `fizzy_tag_card`, `fizzy_assign_card`, `fizzy_watch_card`, `fizzy_unwatch_card`, `fizzy_pin_card`, `fizzy_unpin_card`, `fizzy_mark_golden`, `fizzy_unmark_golden` |
| **Comments** | `fizzy_list_comments`, `fizzy_get_comment`, `fizzy_create_comment`, `fizzy_update_comment`, `fizzy_delete_comment` |
| **Columns** | `fizzy_list_columns`, `fizzy_get_column`, `fizzy_create_column`, `fizzy_update_column`, `fizzy_delete_column` |
| **Tags & Users** | `fizzy_list_tags`, `fizzy_list_users`, `fizzy_get_user` |
| **Reactions** | `fizzy_list_reactions`, `fizzy_create_reaction`, `fizzy_delete_reaction` (on cards and comments) |
| **Steps** | `fizzy_list_steps`, `fizzy_get_step`, `fizzy_create_step`, `fizzy_update_step`, `fizzy_delete_step` |
| **Notifications** | `fizzy_list_notifications`, `fizzy_get_notification`, `fizzy_mark_read`, `fizzy_mark_all_read`, `fizzy_unread_count` |
| **Webhooks** | `fizzy_list_webhooks`, `fizzy_get_webhook`, `fizzy_create_webhook`, `fizzy_update_webhook`, `fizzy_delete_webhook`, `fizzy_test_webhook` |
| **Project Manager** | `fizzy_pm_actionable_cards`, `fizzy_pm_project_context`, `fizzy_pm_report_progress`, `fizzy_pm_start_session`, `fizzy_pm_end_session` |

See the [Tools Reference](https://fizzy.yogan.dev/tools/overview) for complete documentation.

## CLI Commands

```bash
# Interactive setup wizard
npx fizzy-do-mcp configure

# Check current identity
npx fizzy-do-mcp whoami

# View configuration status
npx fizzy-do-mcp status

# Clear stored credentials
npx fizzy-do-mcp logout

# Run as MCP server (default)
npx fizzy-do-mcp
```

## Architecture

```
fizzy-do-mcp/
├── packages/
│   ├── @fizzy-do-mcp/shared/   # Types, schemas, Result type
│   ├── @fizzy-do-mcp/client/   # Type-safe HTTP client for Fizzy API
│   └── @fizzy-do-mcp/tools/    # MCP tool definitions
├── apps/
│   └── server/                  # CLI and MCP server (npm: fizzy-do-mcp)
└── docs/                        # Documentation site (VitePress)
```

## Development

```bash
# Clone the repo
git clone https://github.com/ryanyogan/fizzy-do-mcp.git
cd fizzy-do-mcp

# Install dependencies
vp install

# Run checks (format, lint, typecheck)
vp check

# Run tests
vp test

# Build all packages
vp build

# Develop the CLI
cd apps/server && vp dev

# Develop docs
cd docs && vp dev
```

> **Note:** This project uses [Vite+](https://github.com/nicepkg/vp) (`vp`) as the unified toolchain. All commands go through `vp` instead of calling pnpm/npm directly.

## Versioning & Releases

This project uses [Changesets](https://github.com/changesets/changesets) for version management and automated releases.

### Creating a Changeset

When you make changes that should be released, create a changeset:

```bash
pnpm changeset
```

This will prompt you to:
1. Select which packages have changed
2. Choose the semver bump type (patch/minor/major)
3. Write a summary of the changes

The changeset is saved as a markdown file in `.changeset/` and should be committed with your PR.

### Changeset Guidelines

| Change Type | Version Bump | Examples |
|------------|--------------|----------|
| **Patch** | `0.4.0` → `0.4.1` | Bug fixes, typos, dependency updates |
| **Minor** | `0.4.0` → `0.5.0` | New features, new tools, non-breaking additions |
| **Major** | `0.4.0` → `1.0.0` | Breaking changes, removed tools, API changes |

### Example Changeset

```markdown
---
"fizzy-do-mcp": minor
"@fizzy-do-mcp/tools": minor
---

Add support for card checklists with new step management tools
```

### Release Process

Releases are fully automated via GitHub Actions:

1. **Push to main** - The release workflow runs automatically
2. **Version PR created** - If changesets exist, a "Release" PR is created/updated
3. **Merge the PR** - Merging the Release PR triggers:
   - Version bumps in all affected packages
   - CHANGELOG.md updates with changeset summaries
   - Git tags for each released version
   - npm publish for public packages

### Manual Version Commands

```bash
# Preview what versions would be bumped
pnpm changeset status

# Apply version bumps locally (CI does this automatically)
pnpm version

# Publish packages (CI does this automatically)
pnpm release
```

## Deployments

### npm Package

The main CLI package `fizzy-do-mcp` is published to npm automatically when the Release PR is merged.

| Package | npm | Description |
|---------|-----|-------------|
| `fizzy-do-mcp` | [![npm](https://img.shields.io/npm/v/fizzy-do-mcp.svg)](https://www.npmjs.com/package/fizzy-do-mcp) | CLI and MCP server |
| `@fizzy-do-mcp/client` | Internal | Type-safe API client |
| `@fizzy-do-mcp/tools` | Internal | MCP tool definitions |
| `@fizzy-do-mcp/shared` | Internal | Shared types and schemas |

### Documentation Site

The documentation site is deployed to [Cloudflare Pages](https://pages.cloudflare.com) automatically on every push to `main`.

- **Production URL:** [fizzy.yogan.dev](https://fizzy.yogan.dev)
- **Build command:** `vp build`
- **Output directory:** `docs/.vitepress/dist`

### CI/CD Workflow

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   PR with   │────▶│   Merge to   │────▶│  Release    │
│  changeset  │     │     main     │     │   PR open   │
└─────────────┘     └──────────────┘     └──────────────┘
                                                │
                                                ▼
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  npm has    │◀────│   Packages   │◀────│   Merge     │
│  new version│     │   published  │     │  Release PR │
└─────────────┘     └──────────────┘     └─────────────┘
```

### Required Secrets

Configure these in your GitHub repository settings:

| Secret | Description |
|--------|-------------|
| `NPM_TOKEN` | npm access token with publish permissions |
| `GITHUB_TOKEN` | Automatically provided by GitHub Actions |

### Cloudflare Pages Setup

The docs are deployed via Cloudflare Pages with these settings:

- **Framework preset:** VitePress
- **Build command:** `pnpm install && pnpm --filter docs build`
- **Build output directory:** `docs/.vitepress/dist`
- **Root directory:** `/`
- **Node.js version:** `20`

## Requirements

- **Node.js 20+** - For running the local MCP server
- **Fizzy Account** - Sign up free at [fizzy.do](https://fizzy.do)
- **API Token** - Generate from your Fizzy account settings
- **MCP-Compatible Editor** - Claude Desktop, Cursor, Claude Code, etc.

## Getting Your API Token

1. Log in to [Fizzy](https://fizzy.do)
2. Go to **Account Settings** → **API Tokens**
3. Click **Generate New Token**
4. Copy the token and use it during configuration

## License

MIT

## Credits

- Built for [Claude](https://claude.ai) and the [Model Context Protocol](https://modelcontextprotocol.io)
- Connects to [Fizzy](https://fizzy.do), Basecamp's task management tool
- Developed by [Ryan Yogan](https://github.com/ryanyogan)

---

<p align="center">
  <strong>Free forever. No limits. Open source.</strong>
</p>
