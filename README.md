# Fizzy Do MCP

Open-source MCP server that connects AI assistants to Fizzy (Basecamp's task management) with 70+ tools for boards, cards, workflows, and AI-powered project management.

## What It Is

Fizzy Do MCP is a [Model Context Protocol](https://modelcontextprotocol.io) server that gives AI assistants full read/write access to [Fizzy](https://fizzy.do). Rather than switching between your editor and a project management UI, you manage boards, cards, comments, tags, and workflows through conversation. The tool surface covers the complete Fizzy API: card lifecycle (create, update, close, reopen, triage, postpone), board management, column workflows, checklist steps, reactions, notifications, and webhooks.

It also includes AI-powered project management tools — standup generation, progress tracking, and session management — that synthesize project state from card data rather than requiring manual status updates.

[![npm version](https://img.shields.io/npm/v/fizzy-do-mcp.svg)](https://www.npmjs.com/package/fizzy-do-mcp)

## Quick Start

```bash
npx fizzy-do-mcp configure
```

The interactive wizard detects installed editors and configures them automatically.

**Manual configuration:**

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

## Supported Editors

| Editor | Status | Guide |
|--------|--------|-------|
| Claude Desktop | Full support | [Configure](https://fizzy.yogan.dev/configuration/claude-desktop) |
| Claude Code | Full support | [Configure](https://fizzy.yogan.dev/configuration/claude-code) |
| Cursor | Full support | [Configure](https://fizzy.yogan.dev/configuration/cursor) |
| Windsurf | Full support | [Configure](https://fizzy.yogan.dev/configuration/windsurf) |
| Continue | Full support | [Configure](https://fizzy.yogan.dev/configuration/continue) |
| OpenCode | Full support | [Configure](https://fizzy.yogan.dev/configuration/opencode) |

## Available Tools

70+ tools across these categories:

| Category | Description |
|----------|-------------|
| **Boards** | List, create, update, delete, publish/unpublish |
| **Cards** | Full lifecycle — create, update, close, reopen, triage, postpone |
| **Comments** | Add, edit, delete on cards |
| **Columns** | Manage workflow stages |
| **Tags & Users** | List, lookup, assign |
| **Reactions** | Emoji reactions on cards and comments |
| **Steps** | Checklist items within cards |
| **Notifications** | Read and manage |
| **Webhooks** | Configure integrations |
| **Project Manager** | AI standups, progress tracking, sessions |

> [Full tools reference](https://fizzy.yogan.dev/tools/overview)

## Architecture

```
fizzy-do-mcp/
├── packages/
│   ├── @fizzy-do-mcp/shared/   # Types, schemas, Result type
│   ├── @fizzy-do-mcp/client/   # Type-safe Fizzy API client
│   └── @fizzy-do-mcp/tools/    # MCP tool definitions
├── apps/
│   └── server/                  # CLI and MCP server
└── docs/                        # Documentation (VitePress)
```

## Why This Matters

MCP servers tend to be thin wrappers around a single API. Fizzy Do MCP is more opinionated: the project management tools (standups, progress tracking) demonstrate that MCP tools can synthesize across multiple API calls rather than just proxying them. The AI doesn't just read your board — it generates a standup from card state across all your boards.

## Status

Published on npm. Active development. Full documentation at [fizzy.yogan.dev](https://fizzy.yogan.dev).

## Stack

- **Runtime:** Node.js 20+
- **Language:** TypeScript
- **Protocol:** Model Context Protocol (MCP)
- **Build:** Vite+ (vp), Changesets for versioning
- **Docs:** VitePress

## CLI

```bash
npx fizzy-do-mcp configure   # Interactive setup wizard
npx fizzy-do-mcp whoami      # Check current identity
npx fizzy-do-mcp status      # View configuration status
npx fizzy-do-mcp logout      # Clear stored credentials
npx fizzy-do-mcp             # Run as MCP server
```

## License

MIT — [Ryan Yogan](https://yogan.dev)
