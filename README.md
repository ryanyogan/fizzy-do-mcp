# Fizzy Do MCP

<div align="center">

**AI-Native Task Management with Model Context Protocol**

Connect your AI assistant to [Fizzy](https://fizzy.do) for intelligent, context-aware project management.

[![npm version](https://img.shields.io/npm/v/fizzy-do-mcp.svg)](https://www.npmjs.com/package/fizzy-do-mcp)
[![license](https://img.shields.io/npm/l/fizzy-do-mcp.svg)](https://github.com/ryanyogan/fizzy-do-mcp/blob/main/LICENSE)

[Documentation](https://fizzy.yogan.dev) ・ [Quick Start](https://fizzy.yogan.dev/getting-started/installation) ・ [Issues](https://github.com/ryanyogan/fizzy-do-mcp/issues)

</div>

---

## What is Fizzy Do MCP?

Fizzy Do MCP is a **free, open-source** [Model Context Protocol](https://modelcontextprotocol.io) server that enables AI assistants to interact with [Fizzy](https://fizzy.do), Basecamp's task management tool.

- Read boards, cards, and project context
- Create, update, and organize tasks through conversation
- Move cards through workflows, add comments, and track progress
- AI-powered project management tools for standups and reporting

> **[Read the full documentation →](https://fizzy.yogan.dev)**

---

## Quick Start

Run the interactive setup wizard:

```bash
npx fizzy-do-mcp configure
```

The wizard detects your installed editors and configures them automatically.

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

> **[See installation guide →](https://fizzy.yogan.dev/getting-started/installation)**

---

## Supported Editors

| Editor | Status | Guide |
|--------|--------|-------|
| Claude Desktop | Full support | [Configure →](https://fizzy.yogan.dev/configuration/claude-desktop) |
| Claude Code | Full support | [Configure →](https://fizzy.yogan.dev/configuration/claude-code) |
| Cursor | Full support | [Configure →](https://fizzy.yogan.dev/configuration/cursor) |
| Windsurf | Full support | [Configure →](https://fizzy.yogan.dev/configuration/windsurf) |
| Continue | Full support | [Configure →](https://fizzy.yogan.dev/configuration/continue) |
| OpenCode | Full support | [Configure →](https://fizzy.yogan.dev/configuration/opencode) |

---

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

> **[See more workflow examples →](https://fizzy.yogan.dev/workflows/ai-driven-tasks)**

---

## Available Tools

Fizzy Do MCP provides **70+ tools** across these categories:

| Category | Description |
|----------|-------------|
| **Boards** | List, create, update, delete, publish/unpublish boards |
| **Cards** | Full card lifecycle - create, update, close, reopen, triage, postpone |
| **Comments** | Add, edit, delete comments on cards |
| **Columns** | Manage board columns for workflow stages |
| **Tags & Users** | List tags, list and lookup users |
| **Reactions** | Add emoji reactions to cards and comments |
| **Steps** | Checklist items within cards |
| **Notifications** | Read and manage notifications |
| **Webhooks** | Configure webhook integrations |
| **Project Manager** | AI-powered tools for standups, progress tracking, and sessions |

> **[Full tools reference →](https://fizzy.yogan.dev/tools/overview)**

---

## CLI Commands

```bash
npx fizzy-do-mcp configure   # Interactive setup wizard
npx fizzy-do-mcp whoami      # Check current identity
npx fizzy-do-mcp status      # View configuration status
npx fizzy-do-mcp logout      # Clear stored credentials
npx fizzy-do-mcp             # Run as MCP server
```

> **[CLI documentation →](https://fizzy.yogan.dev/api/cli)**

---

## Development

```bash
# Clone and install
git clone https://github.com/ryanyogan/fizzy-do-mcp.git
cd fizzy-do-mcp
vp install

# Development workflow
vp check          # Format, lint, typecheck
vp test           # Run tests
vp build          # Build all packages

# Run locally
cd apps/server && vp dev    # CLI/server
cd docs && vp dev           # Documentation site
```

This project uses [Vite+](https://github.com/nicepkg/vp) (`vp`) as the unified toolchain.

### Architecture

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

### Releases

This project uses [Changesets](https://github.com/changesets/changesets) for versioning. Create a changeset when making changes:

```bash
pnpm changeset
```

Releases are automated via GitHub Actions when changesets are merged.

---

## Requirements

- **Node.js 20+**
- **Fizzy Account** — [Sign up free](https://fizzy.do)
- **API Token** — Generate from Fizzy account settings
- **MCP-Compatible Editor** — Claude Desktop, Cursor, etc.

---

## License

MIT — [Ryan Yogan](https://yogan.dev)

Built for [Claude](https://claude.ai) and the [Model Context Protocol](https://modelcontextprotocol.io). Connects to [Fizzy](https://fizzy.do), Basecamp's task management tool.
