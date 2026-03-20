# Cursor

[Cursor](https://cursor.com) is an AI-powered code editor with built-in MCP support.

## Automatic Configuration

```bash
npx fizzy-do-mcp@latest configure

# Output:
# Detected: Cursor
# Enter your Fizzy token: ****
# Updated ~/.cursor/mcp.json
```

## Manual Configuration

### Config File Location

| OS | Path |
|----|------|
| macOS | `~/.cursor/mcp.json` |
| Windows | `%USERPROFILE%\.cursor\mcp.json` |
| Linux | `~/.cursor/mcp.json` |

### Configuration

Create or edit `~/.cursor/mcp.json`:

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

Then set in your shell:

```bash
export FIZZY_TOKEN="your-fizzy-api-token"
```

## Multiple MCP Servers

Cursor supports multiple MCP servers:

```json
{
  "mcpServers": {
    "fizzy": {
      "command": "npx",
      "args": ["-y", "fizzy-do-mcp@latest"],
      "env": {
        "FIZZY_TOKEN": "your-token"
      }
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "your-github-token"
      }
    }
  }
}
```

## Restart Required

After saving your config, restart Cursor for changes to take effect.

## Verify It Works

1. Open Cursor
2. Open the AI chat (Cmd/Ctrl + L)
3. Ask: "What Fizzy boards do I have access to?"

You should see your Fizzy boards listed.

## Troubleshooting

### Config file not found

Create the directory and file:

```bash
mkdir -p ~/.cursor
echo '{}' > ~/.cursor/mcp.json
```

### MCP tools not appearing

1. Verify JSON syntax is valid
2. Check that npx is in your PATH
3. Restart Cursor completely
4. Check Cursor's developer console for errors

### Permission errors

On macOS/Linux, ensure the config file is readable:

```bash
chmod 644 ~/.cursor/mcp.json
```

<script setup>
import RelatedLinks from '../.vitepress/theme/components/RelatedLinks.vue'
</script>

<RelatedLinks
  title="Other Editors"
  :items="[
    { title: 'Claude Desktop', link: '/configuration/claude-desktop', description: 'Desktop app setup' },
    { title: 'Windsurf', link: '/configuration/windsurf', description: 'Codeium IDE setup' },
    { title: 'Continue', link: '/configuration/continue', description: 'VS Code extension' },
    { title: 'Environment Variables', link: '/configuration/environment', description: 'Token management' },
  ]"
/>
