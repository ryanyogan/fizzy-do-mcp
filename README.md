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
- **Process AI work queues** - Autonomous vibe coding driven by tagged cards

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

### Option 2: Remote Server

For environments where `npx` isn't available (like web-based AI tools), use the hosted proxy:

```json
{
  "mcpServers": {
    "fizzy": {
      "url": "https://mcp.fizzy.yogan.dev/sse",
      "headers": {
        "X-Fizzy-Token": "your-fizzy-api-token"
      }
    }
  }
}
```

The remote server is **free with no rate limits** - same as local.

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
| **Pending Work** | `fizzy_pending_work_list`, `fizzy_pending_work_get`, `fizzy_pending_work_claim`, `fizzy_pending_work_complete`, `fizzy_pending_work_abandon`, `fizzy_pending_work_status` |

See the [Tools Reference](https://fizzy.yogan.dev/tools/overview) for complete documentation.

## AI Work Queue

Fizzy Do MCP includes a KV-backed work queue that enables autonomous AI coding:

1. **Tag cards** with `#ai-code` (implementation) or `#ai-plan` (break down into steps)
2. **Move cards** to a trigger column (`To Do`, `Ready`, or `Accepted`) to queue them
3. **AI agents** claim work via `fizzy_pending_work_claim`, process it, and mark it complete

Work items flow through statuses: `pending` → `claimed` → `completed` (or `failed` / `abandoned`).

```
You: Let's start vibe coding with Fizzy

AI: [checks pending work queue]
    Found 2 items ready for work:
    - #253 "Update README" (ai-code, pending)
    - #254 "Add dark mode" (ai-plan, pending)

    Claiming #253...
    [does the work, commits, opens PR]
    Done! Marked #253 complete.
```

This enables "vibe coding" - tag your cards, and let AI handle them while you focus on high-level decisions.

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
│   ├── server/                  # CLI and MCP server (npm: fizzy-do-mcp)
│   └── hosted/                  # Hosted proxy service (Cloudflare Workers)
└── docs/                        # Documentation site (VitePress)
```

### Local vs Remote

| Feature | Local Server | Remote Server |
|---------|--------------|---------------|
| Privacy | Tokens stay on your machine | Tokens sent via HTTPS header |
| Rate Limits | None | None |
| Setup | Requires Node.js | Works anywhere |
| Offline | Works offline after install | Requires internet |
| Cost | Free | Free |

**We recommend local** for maximum privacy, but both options are fully supported and free.

## Development

```bash
# Clone the repo
git clone https://github.com/ryanyogan/fizzy-do-mcp.git
cd fizzy-do-mcp

# Install dependencies
pnpm install

# Run checks (format, lint, typecheck)
pnpm check

# Run tests
pnpm test

# Build all packages
pnpm build

# Develop the CLI
cd apps/server && pnpm dev

# Develop docs
cd docs && pnpm dev
```

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
