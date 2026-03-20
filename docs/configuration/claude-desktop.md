# Claude Desktop

[Claude Desktop](https://claude.ai/desktop) is Anthropic's official desktop application for Claude.

## Automatic Configuration

```bash
npx fizzy-do-mcp@latest configure

# Output:
# Detected: Claude Desktop
# Enter your Fizzy token: ****
# Updated ~/Library/Application Support/Claude/claude_desktop_config.json
```

## Manual Configuration

### Config File Location

| OS | Path |
|----|------|
| macOS | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| Windows | `%APPDATA%\Claude\claude_desktop_config.json` |
| Linux | `~/.config/Claude/claude_desktop_config.json` |

### Configuration

Add Fizzy to your `claude_desktop_config.json`:

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

If you prefer to keep your token in environment variables:

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

## Restart Required

After saving your config, fully quit and restart Claude Desktop for changes to take effect.

## Verify It Works

Open Claude Desktop and try:

```
What Fizzy boards do I have access to?
```

You should see a list of your Fizzy boards.

## Troubleshooting

### "Tool fizzy_list_boards not found"

Claude Desktop may need a full restart. Quit completely (check system tray/menu bar) and reopen.

### Config file doesn't exist

Create the file and parent directories if they don't exist:

```bash
# macOS
mkdir -p ~/Library/Application\ Support/Claude
touch ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

### JSON syntax error

Validate your JSON at [jsonlint.com](https://jsonlint.com). Common issues:
- Trailing commas
- Missing quotes around strings
- Unclosed brackets

<script setup>
import RelatedLinks from '../.vitepress/theme/components/RelatedLinks.vue'
</script>

<RelatedLinks
  title="Other Editors"
  :items="[
    { title: 'Claude Code', link: '/configuration/claude-code', description: 'CLI configuration' },
    { title: 'Cursor', link: '/configuration/cursor', description: 'AI code editor setup' },
    { title: 'Windsurf', link: '/configuration/windsurf', description: 'Codeium IDE setup' },
    { title: 'Environment Variables', link: '/configuration/environment', description: 'Token management' },
  ]"
/>
