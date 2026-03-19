---
layout: home

hero:
  name: "Fizzy Do"
  text: "AI Project Manager"
  tagline: A fairly eager Product Manager that loves to Vibe Code
  image:
    src: /logo.svg
    alt: Fizzy MCP
  actions:
    - theme: brand
      text: Get Started
      link: /getting-started/introduction
    - theme: alt
      text: View on GitHub
      link: https://github.com/ryanyogan/fizzy-do-mcp

features:
  - icon: "01"
    title: Model Context Protocol
    details: Native MCP integration lets AI assistants read, create, and manage your Fizzy cards with full context awareness.
  - icon: "02"
    title: Works Everywhere
    details: Claude Desktop, Cursor, OpenCode, Windsurf, Continue, and any MCP-compatible editor.
  - icon: "03"
    title: Open Source
    details: Fully open source and self-hostable. Run your own MCP server or use the hosted proxy.
---

<script setup>
import FeatureCard from './.vitepress/theme/components/FeatureCard.vue'
import FeatureGrid from './.vitepress/theme/components/FeatureGrid.vue'
</script>

## Quick Start

Get started in seconds with npx:

```bash
npx fizzy-do-mcp@latest configure

# Output:
# Detected editors: Claude Desktop, Cursor
# Enter your Fizzy token: ****
# Configuration saved!
```

Or add to your editor config manually:

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

## What Can Your AI Do?

<FeatureGrid>
  <FeatureCard
    icon="BOARDS"
    title="Manage Boards"
    description="List, create, and organize Fizzy boards. Your AI understands your project structure."
  />
  <FeatureCard
    icon="CARDS"
    title="Create & Update Cards"
    description="Add tasks, update descriptions, move cards between columns, and close completed work."
  />
  <FeatureCard
    icon="CONTEXT"
    title="Full Context"
    description="AI reads card descriptions, comments, and tags to provide contextual assistance."
  />
  <FeatureCard
    icon="WORKFLOW"
    title="Automated Workflows"
    description="Let AI triage cards, add comments, assign tags, and keep your board organized."
  />
</FeatureGrid>

## Example Conversation

```
You: What's on my Engineering board?

AI: I found 12 open cards on your Engineering board:

In Progress:
- #234 "Implement user authentication" (assigned to you)
- #235 "API rate limiting"

Needs Triage:
- #240 "Database migration script"
- #241 "Update dependencies"
...

You: Create a card for adding dark mode support

AI: Created card #242 "Add dark mode support" on the Engineering board.
    Would you like me to add any tags or assign it to someone?
```

## Supported Editors

| Editor | Status | Config Format |
|--------|--------|---------------|
| Claude Desktop | Full support | JSON (`mcpServers`) |
| Claude Code | Full support | CLI command |
| Cursor | Full support | JSON (`mcpServers`) |
| OpenCode | Full support | JSON (`mcp`) |
| Windsurf | Full support | JSON (`mcpServers`) |
| Continue | Full support | YAML/JSON array |

[View all configuration guides](/configuration/claude-desktop)
