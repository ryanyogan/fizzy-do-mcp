# Claude Code

[Claude Code](https://github.com/anthropics/claude-code) is Anthropic's official CLI tool for Claude. It uses a different configuration approach than GUI-based editors.

## Installation

Claude Code uses CLI commands to manage MCP servers, not JSON config files.

```bash
$ claude mcp add fizzy -- npx -y fizzy-do-mcp@latest

Added MCP server: fizzy
```

## Set Environment Variable

Claude Code needs your Fizzy token as an environment variable:

```bash
# Add to ~/.bashrc, ~/.zshrc, or ~/.profile
export FIZZY_TOKEN="your-fizzy-api-token"

# Reload your shell
source ~/.bashrc
```

Or for a single session:

```bash
FIZZY_TOKEN="your-token" claude
```

## Managing MCP Servers

### List Configured Servers

```bash
$ claude mcp list

fizzy: npx -y fizzy-do-mcp@latest
```

### Remove a Server

```bash
$ claude mcp remove fizzy

Removed MCP server: fizzy
```

## Verify It Works

Start Claude Code and try a Fizzy command:

```
$ claude

You: What Fizzy boards do I have?

AI: I found 2 boards in your Fizzy account:
    - Engineering (8 open cards)
    - Personal (12 open cards)
```

## Troubleshooting

### "FIZZY_TOKEN environment variable is required"

Make sure your token is exported in your current shell session:

```bash
$ echo $FIZZY_TOKEN
your-fizzy-api-token
```

If empty, set it and restart Claude Code.

### "Command not found: claude"

Ensure Claude Code is installed and in your PATH:

```bash
npm install -g @anthropic-ai/claude-code
```

### MCP server not loading

Try removing and re-adding:

```bash
claude mcp remove fizzy
claude mcp add fizzy -- npx -y fizzy-do-mcp@latest
```
