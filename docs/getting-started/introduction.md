# Introduction

Fizzy MCP is an open-source [Model Context Protocol](https://modelcontextprotocol.io) server that connects AI assistants to [Fizzy](https://fizzy.do), enabling intelligent, context-aware task management.

## What is MCP?

The Model Context Protocol (MCP) is an open standard that allows AI assistants to interact with external tools and data sources. Instead of copy-pasting information between your AI and task manager, MCP lets them communicate directly.

## What Can Fizzy MCP Do?

With Fizzy MCP, your AI assistant can:

- **Read your boards and cards** - Get full context about your projects
- **Create new cards** - Add tasks directly from conversation
- **Update existing cards** - Modify descriptions, tags, and status
- **Move cards** - Triage cards to columns, postpone, or close them
- **Add comments** - Leave notes and updates on cards
- **Search and filter** - Find specific cards by status, tags, or content

## How It Works

```
┌──────────────────┐     ┌──────────────┐     ┌─────────────┐
│   AI Assistant   │────▶│  Fizzy MCP   │────▶│  Fizzy API  │
│ (Claude, etc.)   │◀────│   Server     │◀────│             │
└──────────────────┘     └──────────────┘     └─────────────┘
```

1. **Your AI** sends requests through the MCP protocol
2. **Fizzy MCP** translates them to Fizzy API calls
3. **Fizzy** processes the request and returns results
4. **Your AI** presents the information in conversation

## Running the Server

Run the MCP server locally on your machine:

```bash
npx fizzy-do-mcp@latest
```

Benefits of local installation:
- Maximum privacy (tokens stay local)
- Best performance (no network hops)
- Full offline capability (once configured)

## Requirements

- **Node.js 18+** - For running the local MCP server
- **Fizzy Account** - Sign up at [fizzy.do](https://fizzy.do)
- **API Token** - Generate from your Fizzy account settings
- **MCP-Compatible Editor** - Claude Desktop, Cursor, OpenCode, etc.

<script setup>
import RelatedLinks from '../.vitepress/theme/components/RelatedLinks.vue'
</script>

<RelatedLinks
  title="Next Steps"
  :items="[
    { title: 'Installation', link: '/getting-started/installation', description: 'Set up Fizzy MCP in seconds' },
    { title: 'Quick Start', link: '/getting-started/quickstart', description: 'Your first AI-driven task' },
    { title: 'Configure Your Editor', link: '/configuration/claude-desktop', description: 'Claude, Cursor, VS Code setup' },
  ]"
/>
