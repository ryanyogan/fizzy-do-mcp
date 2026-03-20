# Installation

## Automatic Setup (Recommended)

The easiest way to get started is with our interactive configuration wizard:

```bash
npx fizzy-do-mcp@latest configure

# Output:
# Fizzy MCP Configuration
# ========================
#
# Detected editors:
#   [x] Claude Desktop
#   [x] Cursor
#   [ ] OpenCode (not installed)
#
# Enter your Fizzy token: ****
#
# Configuration saved!
```

The wizard will:
1. Detect installed MCP-compatible editors
2. Prompt for your Fizzy API token
3. Update each editor's configuration file
4. Verify the configuration works

## Manual Setup

If you prefer manual configuration, add Fizzy MCP to your editor's MCP config:

### Get Your Fizzy Token

1. Log in to [Fizzy](https://fizzy.do)
2. Go to **Settings** > **API Tokens**
3. Click **Create Token**
4. Copy the token (you won't see it again)

### Add to Your Editor

::: code-group

```json [Claude Desktop]
// ~/Library/Application Support/Claude/claude_desktop_config.json (macOS)
// %APPDATA%\Claude\claude_desktop_config.json (Windows)
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

```json [Cursor]
// ~/.cursor/mcp.json
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

```toml [OpenCode]
# ~/.config/opencode/config.toml
[mcp.fizzy]
type = "local"
command = ["npx", "-y", "fizzy-do-mcp@latest"]

[mcp.fizzy.environment]
FIZZY_TOKEN = "your-fizzy-api-token"
```

:::

See [Configuration](/configuration/claude-desktop) for all supported editors.

## Environment Variables

Instead of putting your token in config files, you can use environment variables:

```bash
# Add to ~/.bashrc, ~/.zshrc, or ~/.profile
export FIZZY_TOKEN="your-fizzy-api-token"
```

Then omit the `env` section from your editor config:

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

## Verify Installation

After configuration, restart your editor and try a command:

```
You: What boards do I have access to?

AI: I found 3 boards in your Fizzy account:
    - Engineering (12 open cards)
    - Design (5 open cards)
    - Marketing (8 open cards)
```

If you see your boards, you're all set!

## Troubleshooting

### "FIZZY_TOKEN environment variable is required"

Your token isn't configured. Either:
- Add it to your editor's MCP config (`env.FIZZY_TOKEN`)
- Set it as an environment variable
- Run `npx fizzy-do-mcp@latest configure` to reconfigure

### "Invalid token"

Your token may have been revoked or expired. Generate a new one from Fizzy settings.

### "Could not connect to Fizzy API"

Check your internet connection and that fizzy.do is accessible.

### Editor doesn't show Fizzy tools

1. Restart your editor completely
2. Check the MCP config file syntax (must be valid JSON/TOML)
3. Verify the config file location is correct for your OS

<script setup>
import RelatedLinks from '../.vitepress/theme/components/RelatedLinks.vue'
</script>

<RelatedLinks
  title="Next Steps"
  :items="[
    { title: 'Quick Start', link: '/getting-started/quickstart', description: 'Try your first AI-driven task' },
    { title: 'Editor Configuration', link: '/configuration/claude-desktop', description: 'Detailed setup guides' },
    { title: 'Tools Reference', link: '/tools/overview', description: 'All 70+ available tools' },
  ]"
/>
