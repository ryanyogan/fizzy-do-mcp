---
layout: page
title: Fizzy - AI Project Manager
---

<script setup>
import HomeHero from './.vitepress/theme/components/HomeHero.vue'
import QuickLink from './.vitepress/theme/components/QuickLink.vue'
import FeatureCard from './.vitepress/theme/components/FeatureCard.vue'
import FeatureGrid from './.vitepress/theme/components/FeatureGrid.vue'
import EditorBadge from './.vitepress/theme/components/EditorBadge.vue'
import ConversationTerminal from './.vitepress/theme/components/ConversationTerminal.vue'

const exampleConversation = [
  { role: 'user', content: "What's on my Engineering board?" },
  { role: 'ai', content: `I found 12 open cards on your Engineering board:

In Progress:
- #234 "Implement user authentication" (assigned to you)
- #235 "API rate limiting"

Needs Triage:
- #240 "Database migration script"
- #241 "Update dependencies"` },
  { role: 'user', content: 'Create a card for adding dark mode support' },
  { role: 'ai', content: `Created card #242 "Add dark mode support" on Engineering.
Would you like me to add tags or assign it to someone?` },
  { role: 'user', content: 'Tag it with #frontend and #ui, assign to me' },
  { role: 'ai', content: `Done! Card #242 now has tags #frontend and #ui,
and is assigned to you.` },
]
</script>

<HomeHero />

<div class="home-section">

## Quick Links

<FeatureGrid :columns="4">
  <QuickLink
    badge="Start Here"
    title="Installation"
    description="Get up and running in seconds with npx"
    to="/getting-started/installation"
  />
  <QuickLink
    badge="Configure"
    title="Editor Setup"
    description="Claude, Cursor, VS Code, and more"
    to="/configuration/claude-desktop"
  />
  <QuickLink
    badge="Reference"
    title="70+ Tools"
    description="Complete API for boards, cards, and more"
    to="/tools/overview"
  />
  <QuickLink
    badge="Learn"
    title="Workflows"
    description="Real-world AI-driven task patterns"
    to="/workflows/ai-driven-tasks"
  />
</FeatureGrid>

</div>

<div class="home-section">

## What Can Your AI Do?

<FeatureGrid :columns="2">
  <FeatureCard
    icon="Boards"
    title="Manage Boards"
    description="List, create, and organize your Fizzy boards. Your AI understands your entire project structure and can help you stay organized."
  />
  <FeatureCard
    icon="Cards"
    title="Create & Update Cards"
    description="Add tasks, update descriptions, move cards between columns, assign team members, and close completed work."
  />
  <FeatureCard
    icon="Context"
    title="Full Context Awareness"
    description="AI reads card descriptions, comments, tags, and history to provide contextual assistance and smart suggestions."
  />
  <FeatureCard
    icon="Workflow"
    title="Automated Workflows"
    description="Let AI triage incoming cards, add progress comments, bulk-update tags, and keep your board clean and current."
  />
</FeatureGrid>

</div>

<div class="home-section">

## Supported Editors

Configure Fizzy MCP with any of these MCP-compatible editors:

<div class="editor-grid">
  <EditorBadge name="Claude Desktop" icon="claude" to="/configuration/claude-desktop" />
  <EditorBadge name="Claude Code" icon="claude-code" to="/configuration/claude-code" />
  <EditorBadge name="Cursor" icon="cursor" to="/configuration/cursor" />
  <EditorBadge name="OpenCode" icon="opencode" to="/configuration/opencode" />
  <EditorBadge name="Windsurf" icon="windsurf" to="/configuration/windsurf" />
  <EditorBadge name="Continue" icon="continue" to="/configuration/continue" />
</div>

</div>

<div class="home-section">

## Example Conversation

See how natural it is to manage tasks with AI:

<ConversationTerminal title="Example Session" :messages="exampleConversation" />

</div>

<div class="home-section">

## Open Source

Fizzy MCP is fully open source under the MIT License. Run your own MCP server locally with complete privacy - your tokens never leave your machine.

<div class="cta-row">
  <a href="/getting-started/introduction" class="cta-button primary">Read the Docs</a>
  <a href="https://github.com/ryanyogan/fizzy-do-mcp" class="cta-button secondary" target="_blank">View on GitHub</a>
</div>

</div>

<style>
.home-section {
  max-width: 900px;
  margin: 0 auto;
  padding: var(--space-12) var(--space-6);
}

.home-section + .home-section {
  padding-top: 0;
}

.home-section h2 {
  font-family: var(--vp-font-family-mono);
  font-size: 1.5rem;
  font-weight: 600;
  letter-spacing: -0.02em;
  margin: 0 0 var(--space-6);
  padding: 0;
  border: none;
}

.editor-grid {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  margin-top: var(--space-4);
}

.cta-row {
  display: flex;
  gap: var(--space-3);
  margin-top: var(--space-6);
}

.cta-button {
  font-family: var(--vp-font-family-mono);
  font-size: 14px;
  font-weight: 500;
  padding: var(--space-3) var(--space-5);
  text-decoration: none;
  transition: all 0.15s;
  display: inline-block;
}

.cta-button.primary {
  background: var(--vp-c-text-1);
  color: var(--vp-c-bg);
  border: 1px solid var(--vp-c-text-1);
}

.cta-button.primary:hover {
  opacity: 0.85;
}

.cta-button.secondary {
  background: transparent;
  color: var(--vp-c-text-1);
  border: 1px solid var(--vp-c-border);
}

.cta-button.secondary:hover {
  border-color: var(--vp-c-text-1);
  background: var(--vp-c-bg-soft);
}

@media (max-width: 768px) {
  .home-section {
    padding: var(--space-8) var(--space-4);
  }

  .editor-grid {
    flex-direction: column;
  }

  .cta-row {
    flex-direction: column;
  }

  .cta-button {
    text-align: center;
  }
}
</style>
