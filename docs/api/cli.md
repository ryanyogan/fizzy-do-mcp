# CLI Reference

The `fizzy-do-mcp` CLI provides commands for configuring and running the MCP server.

## Installation

```bash
npm install -g fizzy-do-mcp
```

Or use npx:

```bash
npx fizzy-do-mcp
```

## Aliases

The CLI is available as both `fizzy-do-mcp` and the shorter `fdm`:

```bash
fdm configure
fdm status
```

## Commands

### configure

Interactive setup wizard to configure the MCP server.

```bash
fizzy-do-mcp configure
```

The wizard will:
1. Prompt for your Fizzy API token
2. Fetch your available accounts
3. Let you select an account
4. Optionally configure AI agents (Claude Desktop, Cursor, etc.)

Options:
- `--token <token>` - Skip the token prompt
- `--account <slug>` - Skip the account selection

### whoami

Display the currently configured user and account.

```bash
fizzy-do-mcp whoami
```

Output:
```
Logged in as: john@example.com
Account: Engineering Team (/123456)
```

### status

Check the configuration status and connectivity.

```bash
fizzy-do-mcp status
```

Output:
```
Configuration: ~/.config/fizzy-do-mcp/config.json
Token: Configured
Account: /123456 (Engineering Team)
API: Connected
```

### logout

Remove the stored credentials.

```bash
fizzy-do-mcp logout
```

### Server Mode (default)

When run without arguments, starts the MCP server in stdio mode:

```bash
fizzy-do-mcp
```

This is how AI agents run the server.

## Configuration

### Config File Location

```
~/.config/fizzy-do-mcp/config.json
```

### Config File Format

```json
{
  "accessToken": "your-api-token",
  "accountSlug": "/123456",
  "baseUrl": "https://app.fizzy.do"
}
```

### Environment Variables

Override config file settings with environment variables:

| Variable | Description |
|----------|-------------|
| `FIZZY_ACCESS_TOKEN` | API token |
| `FIZZY_ACCOUNT_SLUG` | Account slug |
| `FIZZY_BASE_URL` | API base URL |

Environment variables take precedence over the config file.

## Migration

When upgrading from `fizzy-mcp` to `fizzy-do-mcp`, credentials are automatically migrated from:

```
~/.config/fizzy-mcp/config.json
```

to:

```
~/.config/fizzy-do-mcp/config.json
```

No action required - the migration happens automatically on first run.

## Agent Configuration

### Claude Desktop

The configure wizard can automatically add Fizzy to Claude Desktop's config:

```json
{
  "mcpServers": {
    "fizzy-do-mcp": {
      "command": "npx",
      "args": ["-y", "fizzy-do-mcp"]
    }
  }
}
```

### Claude Code

For Claude Code, add to your settings:

```json
{
  "mcpServers": {
    "fizzy-do-mcp": {
      "command": "npx",
      "args": ["-y", "fizzy-do-mcp"]
    }
  }
}
```

### Cursor

```json
{
  "mcpServers": {
    "fizzy-do-mcp": {
      "command": "npx",
      "args": ["-y", "fizzy-do-mcp"]
    }
  }
}
```

### OpenCode

```json
{
  "mcp": {
    "fizzy-do-mcp": {
      "command": "npx",
      "args": ["-y", "fizzy-do-mcp"]
    }
  }
}
```

## Exit Codes

| Code | Description |
|------|-------------|
| 0 | Success |
| 1 | General error |
| 2 | Configuration error |
| 3 | Authentication error |

## Examples

### Full Setup

```bash
# Configure with wizard
fdm configure

# Verify configuration
fdm status

# Check identity
fdm whoami
```

### Quick Setup

```bash
# Configure with token directly
fdm configure --token abc123 --account /123456
```

### Reset Configuration

```bash
# Remove credentials
fdm logout

# Reconfigure
fdm configure
```

<script setup>
import RelatedLinks from '../.vitepress/theme/components/RelatedLinks.vue'
</script>

<RelatedLinks
  title="Related"
  :items="[
    { title: 'Installation', link: '/getting-started/installation', description: 'Full setup guide' },
    { title: 'Environment Variables', link: '/configuration/environment', description: 'Token configuration' },
    { title: 'TypeScript Client', link: '/api/client', description: 'Programmatic API' },
  ]"
/>
