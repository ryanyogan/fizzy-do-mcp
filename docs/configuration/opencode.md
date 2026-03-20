# OpenCode

[OpenCode](https://opencode.ai) is an open-source AI coding assistant with native MCP support.

## Config File Location

| OS | Path |
|----|------|
| macOS | `~/.config/opencode/opencode.json` |
| Windows | `%APPDATA%\opencode\opencode.json` |
| Linux | `~/.config/opencode/opencode.json` |

## Local Server (Recommended)

Add Fizzy Do to your `opencode.json`:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "fizzy": {
      "type": "local",
      "command": ["npx", "-y", "fizzy-do-mcp@latest"],
      "environment": {
        "FIZZY_TOKEN": "your-fizzy-api-token"
      }
    }
  }
}
```

::: warning OpenCode-Specific Format
OpenCode's MCP configuration differs from other editors:
- Uses `mcp` key (not `mcpServers`)
- Uses `command` as an array (not separate `command` and `args`)
- Requires `type: "local"` or `type: "remote"`
- Uses `environment` (not `env`)
:::

## Multiple Servers

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "fizzy": {
      "type": "local",
      "command": ["npx", "-y", "fizzy-do-mcp@latest"],
      "environment": {
        "FIZZY_TOKEN": "your-fizzy-token"
      }
    },
    "github": {
      "type": "local",
      "command": ["npx", "-y", "@modelcontextprotocol/server-github"],
      "environment": {
        "GITHUB_TOKEN": "your-github-token"
      }
    }
  }
}
```

## Configuration Reference

| Field | Type | Description |
|-------|------|-------------|
| `type` | `"local"` \| `"remote"` | Server type (required) |
| `command` | `string[]` | Command array for local servers |
| `url` | `string` | URL for remote servers |
| `environment` | `object` | Environment variables (local) |
| `headers` | `object` | HTTP headers (remote) |

## Verify It Works

Restart OpenCode and try:

```
What Fizzy boards do I have?
```

## Troubleshooting

### "Unknown type: stdio"

Use `type: "local"` instead of `type: "stdio"`:

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

### "Unknown type: http"

Use `type: "remote"` instead of `type: "http"`.

### "env is not a valid field"

Use `environment` instead of `env`:

```json
{
  "mcp": {
    "fizzy": {
      "type": "local",
      "command": ["npx", "-y", "fizzy-do-mcp@latest"],
      "environment": {
        "FIZZY_TOKEN": "your-token"
      }
    }
  }
}
```

### "args is not a valid field"

OpenCode uses a single `command` array instead of separate `command` and `args`:

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

### Config not loading

1. Verify JSON syntax at [jsonlint.com](https://jsonlint.com/)
2. Check file is named `opencode.json` (not `config.toml`)
3. Ensure the `$schema` line is included for validation
4. Restart OpenCode completely
