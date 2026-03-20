# Quick Start

This guide walks through your first AI-powered interaction with Fizzy.

## Prerequisites

- Fizzy MCP installed and configured ([Installation](/getting-started/installation))
- At least one Fizzy board with some cards
- An MCP-compatible editor (Claude Desktop, Cursor, etc.)

## Step 1: Explore Your Boards

Start by asking your AI what you have access to:

```
You: What Fizzy boards can I access?
```

Your AI will call `fizzy_list_boards` and respond with something like:

```
AI: You have access to 2 boards:

1. **Engineering** - 8 open cards, 3 in triage
   Last updated: 2 hours ago

2. **Personal Tasks** - 12 open cards, 0 in triage
   Last updated: today
```

## Step 2: View Cards on a Board

Ask about specific boards to see what's there:

```
You: Show me the cards on my Engineering board
```

```
AI: Here are the cards on Engineering:

**In Progress** (2 cards)
- #156 "Implement OAuth flow" - assigned to @ryan, #auth #backend
- #157 "Update API documentation"

**Needs Triage** (3 cards)
- #160 "Bug: Login redirect fails on mobile"
- #161 "Add rate limiting to public endpoints"
- #162 "Refactor database queries"

**Not Now** (3 cards)
- #150 "Explore GraphQL migration"
- #151 "Performance audit"
- #152 "Upgrade to Node 22"
```

## Step 3: Create a New Card

Let your AI create tasks directly:

```
You: Create a card for adding unit tests to the auth module
```

```
AI: Created card #163 "Add unit tests to auth module" on the Engineering board.

The card is currently in triage. Would you like me to:
- Move it to a specific column?
- Add any tags?
- Assign it to someone?
```

## Step 4: Update and Organize

You can have full conversations about task management:

```
You: Move it to In Progress and add the #testing tag
```

```
AI: Done! Card #163 is now in the "In Progress" column with the #testing tag.
```

## Step 5: Add Context with Comments

Your AI can leave detailed comments:

```
You: Add a comment to card #163 with the test files we need to create
```

```
AI: I'll add a comment listing the test files. What tests do you need?
```

```
You: We need tests for login, logout, token refresh, and password reset
```

```
AI: Added comment to #163:

> Test files needed:
> - `auth.login.test.ts`
> - `auth.logout.test.ts`
> - `auth.token-refresh.test.ts`
> - `auth.password-reset.test.ts`
```

## Step 6: Complete Work

When you're done with a task:

```
You: Close card #163, tests are complete
```

```
AI: Closed card #163 "Add unit tests to auth module". Nice work!
```

## Common Workflows

### Daily Standup Review

```
You: What cards am I assigned to that are in progress?
```

### Quick Triage

```
You: Show me all cards in triage on Engineering and help me prioritize them
```

### Project Status

```
You: Give me a summary of the Engineering board - what's blocked, what's in progress, and what's completed this week?
```

### Batch Operations

```
You: Move all cards tagged #v2 to the "Next Release" column
```

## Tips for Effective Use

1. **Be specific** - "Create a card for X on the Engineering board" works better than "add a task"

2. **Reference card numbers** - Use `#123` to reference specific cards

3. **Ask for context** - "Show me the description and comments on #123" gives your AI full context

4. **Let AI help organize** - "What cards should I work on today?" can provide smart suggestions based on your board state

<script setup>
import RelatedLinks from '../.vitepress/theme/components/RelatedLinks.vue'
</script>

<RelatedLinks
  title="Continue Learning"
  :items="[
    { title: 'AI-Driven Workflows', link: '/workflows/ai-driven-tasks', description: 'Advanced workflow patterns' },
    { title: 'Tools Reference', link: '/tools/overview', description: 'Full list of 70+ tools' },
    { title: 'Project Management', link: '/workflows/project-management', description: 'Sprint planning and releases' },
  ]"
/>
