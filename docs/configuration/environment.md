# Environment Variables

Fizzy MCP can be configured through environment variables. This is useful for keeping secrets out of config files and for CI/CD environments.

## Required Variables

### `FIZZY_TOKEN`

Your Fizzy API token. **Required** for all operations.

```bash
export FIZZY_TOKEN="your-fizzy-api-token"
```

Get your token from [Fizzy Settings](https://fizzy.do) > API Tokens.

## Optional Variables

### `FIZZY_API_URL`

Override the Fizzy API base URL. Defaults to `https://api.fizzy.do`.

```bash
export FIZZY_API_URL="https://api.fizzy.do"
```

Useful for development/testing against staging environments.

## Setting Environment Variables

### Shell Profile (Persistent)

Add to your shell profile for persistent configuration:

::: code-group

```bash [bash]
# ~/.bashrc or ~/.bash_profile
export FIZZY_TOKEN="your-fizzy-api-token"
```

```zsh [zsh]
# ~/.zshrc
export FIZZY_TOKEN="your-fizzy-api-token"
```

```fish [fish]
# ~/.config/fish/config.fish
set -gx FIZZY_TOKEN "your-fizzy-api-token"
```

```powershell [PowerShell]
# $PROFILE
$env:FIZZY_TOKEN = "your-fizzy-api-token"
```

:::

Then reload your shell:

```bash
source ~/.zshrc  # or ~/.bashrc
```

### Per-Session

Set temporarily for the current session:

```bash
export FIZZY_TOKEN="your-token"
npx fizzy-do-mcp@latest
```

### Per-Command

Set for a single command:

```bash
FIZZY_TOKEN="your-token" npx fizzy-do-mcp@latest
```

## Editor Configuration

### With Environment Variables

If you set `FIZZY_TOKEN` in your shell, you can simplify editor configs:

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

The MCP server will inherit environment variables from your shell.

### Without Environment Variables

If you can't use shell environment variables, set them in the editor config:

```json
{
  "mcpServers": {
    "fizzy": {
      "command": "npx",
      "args": ["-y", "fizzy-do-mcp@latest"],
      "env": {
        "FIZZY_TOKEN": "your-fizzy-api-token"
      }
    }
  }
}
```

## Security Considerations

### Don't Commit Tokens

Never commit your Fizzy token to version control. Add config files to `.gitignore`:

```gitignore
# MCP configs with tokens
.cursor/mcp.json
.continue/config.json
```

### Use Environment Variables

Environment variables are more secure than config files:
- Not visible in editor UI
- Not accidentally committed
- Can be managed by secret managers

### Rotate Tokens Regularly

Generate new tokens periodically from Fizzy settings and revoke old ones.

## Troubleshooting

### "FIZZY_TOKEN environment variable is required"

The token isn't set. Either:
1. Export it in your shell
2. Add it to your editor's MCP config `env` section

### Token not found despite being set

Your editor might not inherit shell environment:

1. **GUI apps on macOS** don't always get shell env vars. Set in editor config instead.
2. **Windows** - Use system environment variables or editor config.
3. **Linux** - Ensure you're starting the editor from a shell with the variable set.

### Verify token is set

```bash
echo $FIZZY_TOKEN
# Should print: fz_abc123...
```

If empty, the variable isn't exported in your current shell.

<script setup>
import RelatedLinks from '../.vitepress/theme/components/RelatedLinks.vue'
</script>

<RelatedLinks
  title="Editor Setup Guides"
  :items="[
    { title: 'Claude Desktop', link: '/configuration/claude-desktop', description: 'Desktop app setup' },
    { title: 'Cursor', link: '/configuration/cursor', description: 'AI code editor setup' },
    { title: 'Continue', link: '/configuration/continue', description: 'VS Code extension' },
    { title: 'Quick Start', link: '/getting-started/quickstart', description: 'First AI-driven task' },
  ]"
/>
