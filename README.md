# Fizzy MCP Server

An MCP (Model Context Protocol) server that enables AI agents to interact with [Fizzy](https://fizzy.do), Basecamp's task management tool.

## Features

- **40 MCP tools** covering all major Fizzy operations
- **Type-safe** TypeScript implementation with Zod validation
- **Retry with exponential backoff** for rate limits and transient errors
- **Auto-detection** of Fizzy account on first run
- **Secure credential storage** in `~/.config/fizzy-mcp/config.json`
- **Environment variable support** for CI/CD and containerized deployments

## Getting Started

### 1. Get a Fizzy Access Token

1. Go to [app.fizzy.do](https://app.fizzy.do)
2. Click your avatar in the top right
3. Go to **Profile** → **API**
4. Create a new **Personal Access Token**
5. Copy the token (you won't see it again!)

### 2. Install and Configure

```bash
# Install globally
npm install -g fizzy-do-mcp

# Configure with your access token
fizzy-mcp auth
```

Or use environment variables:

```bash
export FIZZY_ACCESS_TOKEN="your-token-here"
export FIZZY_ACCOUNT_SLUG="/897362094"  # Optional, auto-detected if omitted
```

### 3. Add to Your AI Agent

**Claude Desktop** (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "fizzy": {
      "command": "npx",
      "args": ["-y", "fizzy-do-mcp@latest"]
    }
  }
}
```

**OpenCode** (`~/.config/opencode/opencode.json`):

```json
{
  "mcp": {
    "fizzy": {
      "type": "local",
      "command": ["npx", "-y", "fizzy-do-mcp@latest"]
    }
  }
}
```

**Cursor** (`~/.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "fizzy": {
      "command": "npx",
      "args": ["-y", "fizzy-do-mcp@latest"]
    }
  }
}
```

Credentials are stored securely in `~/.config/fizzy-mcp/config.json` - no need to add tokens to your MCP config.

### 4. Start Using

Restart Claude Desktop and you'll have access to all Fizzy tools. Try asking:

- "List all my Fizzy boards"
- "Show me cards assigned to me"
- "Create a new card on the Engineering board called 'Review PR #123'"
- "Close card #42 and add a comment saying it's done"

## CLI Commands

```bash
# Configure authentication interactively
fizzy-mcp auth

# Check current configuration
fizzy-mcp status

# Show your Fizzy identity and accounts
fizzy-mcp whoami

# Clear stored credentials
fizzy-mcp logout

# Run the MCP server (default command)
fizzy-mcp
```

## Available Tools

### Identity & Account (2 tools)
| Tool | Description |
|------|-------------|
| `fizzy_get_identity` | Get current user and list accessible accounts |
| `fizzy_get_account` | Get account settings (name, card count, auto-postpone) |

### Boards (7 tools)
| Tool | Description |
|------|-------------|
| `fizzy_list_boards` | List all boards in the account |
| `fizzy_get_board` | Get a specific board by ID |
| `fizzy_create_board` | Create a new board |
| `fizzy_update_board` | Update board name or settings |
| `fizzy_delete_board` | Delete a board |
| `fizzy_archive_board` | Archive a board |
| `fizzy_unarchive_board` | Unarchive a board |

### Cards (18 tools)
| Tool | Description |
|------|-------------|
| `fizzy_list_cards` | List cards with optional filters |
| `fizzy_get_card` | Get a card by number |
| `fizzy_create_card` | Create a new card |
| `fizzy_update_card` | Update card title, description, or tags |
| `fizzy_delete_card` | Delete a card |
| `fizzy_close_card` | Close (complete) a card |
| `fizzy_reopen_card` | Reopen a closed card |
| `fizzy_postpone_card` | Move card to "Not Now" |
| `fizzy_triage_card` | Move card to a column |
| `fizzy_untriage_card` | Remove card from column (back to triage) |
| `fizzy_tag_card` | Toggle a tag on a card |
| `fizzy_assign_card` | Toggle user assignment on a card |
| `fizzy_watch_card` | Subscribe to card notifications |
| `fizzy_unwatch_card` | Unsubscribe from card notifications |
| `fizzy_pin_card` | Pin a card for quick access |
| `fizzy_unpin_card` | Unpin a card |
| `fizzy_mark_golden` | Mark a card as golden (important) |
| `fizzy_unmark_golden` | Remove golden status |

### Comments (5 tools)
| Tool | Description |
|------|-------------|
| `fizzy_list_comments` | List comments on a card |
| `fizzy_get_comment` | Get a specific comment |
| `fizzy_create_comment` | Add a comment to a card |
| `fizzy_update_comment` | Update a comment |
| `fizzy_delete_comment` | Delete a comment |

### Columns (5 tools)
| Tool | Description |
|------|-------------|
| `fizzy_list_columns` | List columns on a board |
| `fizzy_get_column` | Get a specific column |
| `fizzy_create_column` | Create a new column |
| `fizzy_update_column` | Update column name or color |
| `fizzy_delete_column` | Delete a column |

### Tags (1 tool)
| Tool | Description |
|------|-------------|
| `fizzy_list_tags` | List all tags in the account |

### Users (2 tools)
| Tool | Description |
|------|-------------|
| `fizzy_list_users` | List all active users |
| `fizzy_get_user` | Get a specific user's details |

## Configuration

### Config File

Stored at `~/.config/fizzy-mcp/config.json` with mode 600 (owner read/write only):

```json
{
  "accessToken": "your-token",
  "accountSlug": "/897362094",
  "baseUrl": "https://app.fizzy.do"
}
```

### Environment Variables

Environment variables take precedence over the config file:

| Variable | Description |
|----------|-------------|
| `FIZZY_ACCESS_TOKEN` | Personal access token (required) |
| `FIZZY_ACCOUNT_SLUG` | Account slug, e.g., `/897362094` (optional, auto-detected) |
| `FIZZY_BASE_URL` | API base URL (default: `https://app.fizzy.do`) |

## Development

### Project Structure

```
fizzy-mcp/
├── packages/
│   ├── shared/     # Types, schemas, Result type, errors
│   ├── client/     # Type-safe HTTP client for Fizzy API
│   └── tools/      # MCP tool definitions
├── apps/
│   └── server/     # MCP server and CLI
├── turbo.json      # Turborepo config
└── pnpm-workspace.yaml
```

### Local Development

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run type checker
pnpm typecheck

# Run linter
pnpm lint

# Format code
pnpm format
```

### Testing Locally

```bash
# Configure with your token
cd apps/server
node dist/cli.js auth

# Check status
node dist/cli.js status

# Run the server (for testing with MCP inspector)
node dist/index.js
```

## Architecture

The project uses a monorepo structure with clear separation of concerns:

- **@fizzy-mcp/shared** - Core types, Zod schemas, Result type for error handling
- **@fizzy-mcp/client** - Fizzy API client with dependency injection, retry logic
- **@fizzy-mcp/tools** - MCP tool registration, maps client methods to MCP tools
- **fizzy-do-mcp** - Entry point, CLI, credential management (published to npm)

All packages are built with [tsup](https://tsup.egoist.dev/) targeting ES2022 and are fully tree-shakeable.

## License

MIT

## Credits

Built for use with [Claude](https://claude.ai) and the [Model Context Protocol](https://modelcontextprotocol.io).
