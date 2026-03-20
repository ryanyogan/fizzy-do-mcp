# Continue

[Continue](https://continue.dev) is an open-source AI coding assistant that works in VS Code and JetBrains IDEs. It supports MCP through its configuration file.

## Config File Location

Continue uses a `config.json` file:

| OS | Path |
|----|------|
| macOS | `~/.continue/config.json` |
| Windows | `%USERPROFILE%\.continue\config.json` |
| Linux | `~/.continue/config.json` |

## Configuration

Continue uses an **array format** for MCP servers (different from other editors):

```json
{
  "mcpServers": [
    {
      "name": "fizzy",
      "command": "npx",
      "args": ["-y", "fizzy-do-mcp@latest"],
      "env": {
        "FIZZY_TOKEN": "your-fizzy-api-token"
      }
    }
  ]
}
```

::: warning Array Format
Continue uses `mcpServers` as an **array** with a `name` field, not an object like other editors.
:::

### Using Environment Variables

```json
{
  "mcpServers": [
    {
      "name": "fizzy",
      "command": "npx",
      "args": ["-y", "fizzy-do-mcp@latest"]
    }
  ]
}
```

Then set in your shell:

```bash
export FIZZY_TOKEN="your-fizzy-api-token"
```

## Multiple Servers

```json
{
  "mcpServers": [
    {
      "name": "fizzy",
      "command": "npx",
      "args": ["-y", "fizzy-do-mcp@latest"],
      "env": {
        "FIZZY_TOKEN": "your-fizzy-token"
      }
    },
    {
      "name": "github",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "your-github-token"
      }
    }
  ]
}
```

## Full Config Example

Here's a more complete Continue config with Fizzy:

```json
{
  "models": [
    {
      "model": "claude-3-5-sonnet-latest",
      "provider": "anthropic",
      "apiKey": "your-anthropic-key"
    }
  ],
  "mcpServers": [
    {
      "name": "fizzy",
      "command": "npx",
      "args": ["-y", "fizzy-do-mcp@latest"],
      "env": {
        "FIZZY_TOKEN": "your-fizzy-token"
      }
    }
  ]
}
```

## Restart Required

After saving your config, reload the Continue extension (or restart your IDE) for changes to take effect.

## Verify It Works

1. Open VS Code or JetBrains IDE with Continue
2. Open the Continue chat panel
3. Ask: "What Fizzy boards do I have?"

## Troubleshooting

### "mcpServers must be an array"

Make sure you're using array syntax:

```json
// Wrong (object syntax)
{
  "mcpServers": {
    "fizzy": { ... }
  }
}

// Correct (array syntax)
{
  "mcpServers": [
    { "name": "fizzy", ... }
  ]
}
```

### Config file doesn't exist

Create it:

```bash
mkdir -p ~/.continue
echo '{ "mcpServers": [] }' > ~/.continue/config.json
```

### MCP tools not appearing

1. Check Continue version supports MCP (v0.9+)
2. Verify JSON syntax
3. Reload the Continue extension
4. Check the Continue output panel for errors

### Finding Continue logs

In VS Code:
1. Open Command Palette (Cmd/Ctrl + Shift + P)
2. Search "Continue: Open Logs"
3. Look for MCP-related errors

<script setup>
import RelatedLinks from '../.vitepress/theme/components/RelatedLinks.vue'
</script>

<RelatedLinks
  title="Other Editors"
  :items="[
    { title: 'Claude Desktop', link: '/configuration/claude-desktop', description: 'Desktop app setup' },
    { title: 'Cursor', link: '/configuration/cursor', description: 'AI code editor setup' },
    { title: 'OpenCode', link: '/configuration/opencode', description: 'Open-source AI assistant' },
    { title: 'Environment Variables', link: '/configuration/environment', description: 'Token management' },
  ]"
/>
