# Windsurf

[Windsurf](https://codeium.com/windsurf) is Codeium's AI-powered IDE with MCP support.

## Automatic Configuration

```bash
npx fizzy-do-mcp@latest configure

# Output:
# Detected: Windsurf
# Enter your Fizzy token: ****
# Updated ~/.windsurf/mcp.json
```

## Manual Configuration

### Config File Location

| OS | Path |
|----|------|
| macOS | `~/.windsurf/mcp.json` |
| Windows | `%USERPROFILE%\.windsurf\mcp.json` |
| Linux | `~/.windsurf/mcp.json` |

### Configuration

Windsurf uses the same format as Claude Desktop and Cursor:

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

### Using Environment Variables

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

Then add to your shell profile:

```bash
export FIZZY_TOKEN="your-fizzy-api-token"
```

## Using the Hosted Proxy

```json
{
  "mcpServers": {
    "fizzy": {
      "url": "https://fizzy.yogan.dev/mcp",
      "headers": {
        "X-Fizzy-Token": "your-fizzy-api-token"
      }
    }
  }
}
```

## Restart Required

After saving your config, restart Windsurf for changes to take effect.

## Verify It Works

1. Open Windsurf
2. Open the AI assistant panel
3. Ask: "What Fizzy boards do I have?"

## Troubleshooting

### Config directory doesn't exist

Create it:

```bash
mkdir -p ~/.windsurf
```

### MCP tools not appearing

1. Verify JSON syntax
2. Check Windsurf version supports MCP
3. Restart Windsurf completely
4. Check Windsurf logs for MCP errors

### npx not found

Windsurf may need the full path to npx:

```json
{
  "mcpServers": {
    "fizzy": {
      "command": "/usr/local/bin/npx",
      "args": ["-y", "fizzy-do-mcp@latest"],
      "env": {
        "FIZZY_TOKEN": "your-token"
      }
    }
  }
}
```

Find your npx path with:

```bash
which npx
# Output: /usr/local/bin/npx
```

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
