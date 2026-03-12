# Fizzy MCP Server - Specification

## Goal

Create a high-quality, production-ready MCP (Model Context Protocol) server for Fizzy (Basecamp's task management tool) that allows AI agents to interact with the Fizzy API.

## Requirements

- Written in idiomatic TypeScript
- Use pnpm workspace monorepo with Turborepo
- Cloudflare Workers compatible (no native dependencies)
- Use dependency injection for extensibility
- Have robust error handling with Result types
- Include comprehensive documentation
- Support local stdio transport initially, with future HTTP transport for CF Workers

## Design Decisions

- Based on Fizzy API docs: https://github.com/basecamp/fizzy/blob/main/docs/API.md
- Use `@fizzy-mcp/*` scoped package names
- Use oxlint for linting (added to root package.json)
- Store credentials in plain text config file (`~/.config/fizzy-mcp/config.json`) with mode 600
- Auto-detect account slug from identity endpoint on first run
- Prefix all MCP tools with `fizzy_` (e.g., `fizzy_list_cards`)
- Implement retry with exponential backoff for rate limits (429) and server errors
- Environment variables take precedence over config file for credentials

## Discoveries

- MCP SDK uses `@modelcontextprotocol/sdk` package with `McpServer` class and `server.tool()` method for registering tools
- `exactOptionalPropertyTypes` in tsconfig causes issues with optional params - need to use spread operator or explicit undefined checks
- Fizzy API uses Bearer token auth, returns JSON, supports ETags for caching
- Card numbers are used for referencing cards (not IDs) in most endpoints
- Identity endpoint (`/my/identity`) doesn't require account slug and returns list of accessible accounts
- Identity response structure: `{ accounts: [{ name, id, slug, user: { name, email_address, ... } }] }` - user info is nested under each account
- ToolResult type needs `[key: string]: unknown` index signature for MCP SDK compatibility

## Project Structure

```
fizzy-mcp/
├── package.json                          # Root package with scripts, oxlint
├── pnpm-workspace.yaml                   # Workspace config
├── turbo.json                            # Turborepo config
├── tsconfig.json                         # Base TypeScript config
├── vitest.config.ts                      # Test config
├── oxlint.json                           # Linting config
├── .prettierrc                           # Formatting config
├── .gitignore
├── .env.example
├── README.md                             # Documentation
├── SPEC.md                               # This file
├── packages/
│   ├── shared/                           # @fizzy-mcp/shared
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── result.ts                 # Result<T,E> type
│   │   │   ├── errors.ts                 # FizzyError hierarchy
│   │   │   ├── config.ts                 # Config types
│   │   │   └── schemas/                  # Zod schemas
│   │   │       ├── index.ts
│   │   │       ├── common.ts
│   │   │       ├── identity.ts
│   │   │       ├── boards.ts
│   │   │       ├── cards.ts
│   │   │       ├── columns.ts
│   │   │       ├── comments.ts
│   │   │       ├── tags.ts
│   │   │       ├── users.ts
│   │   │       └── steps.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── client/                           # @fizzy-mcp/client
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── client.ts                 # FizzyClient class
│   │   │   ├── http/
│   │   │   │   ├── index.ts
│   │   │   │   ├── types.ts              # HttpClient interface
│   │   │   │   ├── fetch-client.ts       # Fetch implementation
│   │   │   │   └── retry.ts              # Retry with backoff
│   │   │   └── endpoints/
│   │   │       ├── index.ts
│   │   │       ├── base.ts               # BaseEndpoint class
│   │   │       ├── identity.ts
│   │   │       ├── boards.ts
│   │   │       ├── cards.ts
│   │   │       ├── columns.ts
│   │   │       ├── comments.ts
│   │   │       ├── tags.ts
│   │   │       ├── users.ts
│   │   │       └── pins.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── tools/                            # @fizzy-mcp/tools
│       ├── src/
│       │   ├── index.ts
│       │   ├── register.ts               # registerAllTools()
│       │   ├── utils.ts                  # formatToolSuccess/Error helpers
│       │   ├── identity/
│       │   │   ├── tools.ts              # 2 tools
│       │   │   └── index.ts
│       │   ├── boards/
│       │   │   ├── tools.ts              # 7 tools
│       │   │   └── index.ts
│       │   ├── cards/
│       │   │   ├── tools.ts              # 18 tools
│       │   │   └── index.ts
│       │   ├── comments/
│       │   │   ├── tools.ts              # 5 tools
│       │   │   └── index.ts
│       │   ├── columns/
│       │   │   ├── tools.ts              # 5 tools
│       │   │   └── index.ts
│       │   ├── tags/
│       │   │   ├── tools.ts              # 1 tool
│       │   │   └── index.ts
│       │   └── users/
│       │       ├── tools.ts              # 2 tools
│       │       └── index.ts
│       ├── package.json
│       └── tsconfig.json
└── apps/
    └── server/                           # @fizzy-mcp/server
        ├── src/
        │   ├── index.ts                  # MCP server entry point
        │   ├── cli.ts                    # CLI (auth, whoami, status, logout)
        │   └── credentials.ts            # Config file management
        ├── package.json
        ├── tsconfig.json
        └── tsup.config.ts
```

## Tools Implemented (40 total)

### Identity (2 tools)
- `fizzy_get_identity` - Get current user and list accessible accounts
- `fizzy_get_account` - Get account settings

### Boards (7 tools)
- `fizzy_list_boards` - List all boards
- `fizzy_get_board` - Get board by ID
- `fizzy_create_board` - Create new board
- `fizzy_update_board` - Update board
- `fizzy_delete_board` - Delete board
- `fizzy_archive_board` - Archive board
- `fizzy_unarchive_board` - Unarchive board

### Cards (18 tools)
- `fizzy_list_cards` - List cards with filters
- `fizzy_get_card` - Get card by number
- `fizzy_create_card` - Create card
- `fizzy_update_card` - Update card
- `fizzy_delete_card` - Delete card
- `fizzy_close_card` - Close/complete card
- `fizzy_reopen_card` - Reopen card
- `fizzy_postpone_card` - Move to "Not Now"
- `fizzy_triage_card` - Move to column
- `fizzy_untriage_card` - Remove from column
- `fizzy_tag_card` - Toggle tag
- `fizzy_assign_card` - Toggle assignment
- `fizzy_watch_card` - Subscribe to notifications
- `fizzy_unwatch_card` - Unsubscribe
- `fizzy_pin_card` - Pin card
- `fizzy_unpin_card` - Unpin card
- `fizzy_mark_golden` - Mark as golden
- `fizzy_unmark_golden` - Remove golden status

### Comments (5 tools)
- `fizzy_list_comments` - List comments on card
- `fizzy_get_comment` - Get comment by ID
- `fizzy_create_comment` - Add comment
- `fizzy_update_comment` - Update comment
- `fizzy_delete_comment` - Delete comment

### Columns (5 tools)
- `fizzy_list_columns` - List columns on board
- `fizzy_get_column` - Get column by ID
- `fizzy_create_column` - Create column
- `fizzy_update_column` - Update column
- `fizzy_delete_column` - Delete column

### Tags (1 tool)
- `fizzy_list_tags` - List all tags

### Users (2 tools)
- `fizzy_list_users` - List all users
- `fizzy_get_user` - Get user by ID

## CLI Commands

- `fizzy-mcp auth` - Configure access token interactively
- `fizzy-mcp whoami` - Show current identity
- `fizzy-mcp status` - Check configuration status
- `fizzy-mcp logout` - Clear stored credentials
- `fizzy-mcp` (default) - Run the MCP server

## Configuration

### Config File Location
`~/.config/fizzy-mcp/config.json` (mode 600)

```json
{
  "accessToken": "your-token",
  "accountSlug": "/897362094",
  "baseUrl": "https://app.fizzy.do"
}
```

### Environment Variables (take precedence)
- `FIZZY_ACCESS_TOKEN` - Required
- `FIZZY_ACCOUNT_SLUG` - Optional, auto-detected
- `FIZZY_BASE_URL` - Optional, defaults to https://app.fizzy.do

## Testing Locally

### 1. Build
```bash
cd /home/ryan/personal/fizzy-mcp
pnpm install
pnpm build
```

### 2. Configure
```bash
cd apps/server
node dist/cli.js auth
```

### 3. Test CLI
```bash
node dist/cli.js status
node dist/cli.js whoami
node dist/cli.js --help
```

### 4. Add to Claude Desktop

Edit `~/.config/claude/claude_desktop_config.json` (Linux) or `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS):

```json
{
  "mcpServers": {
    "fizzy": {
      "command": "node",
      "args": ["/home/ryan/personal/fizzy-mcp/apps/server/dist/cli.js"]
    }
  }
}
```

Restart Claude Desktop.

## Publishing to npm

### Prerequisites
1. npm account at npmjs.com
2. Create npm organization "fizzy-mcp" (for scoped packages)
3. `npm login`

### Publish Commands
```bash
pnpm build

cd packages/shared && npm publish --access public
cd ../client && npm publish --access public
cd ../tools && npm publish --access public
cd ../../apps/server && npm publish --access public
```

## Remaining Tasks

- [ ] Add `repository`, `author`, `bugs`, `homepage` to package.json files before publishing
- [ ] Write tests with vitest (optional)
- [ ] Consider adding changesets for version management
- [ ] Future: HTTP transport for Cloudflare Workers deployment
