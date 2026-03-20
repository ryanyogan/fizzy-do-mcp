# Setup Guide

Get Vibe Coding running in your project in about 5 minutes.

## Prerequisites

Before starting, ensure you have:

- **Fizzy Account** — Sign up at [fizzy.do](https://fizzy.do)
- **Fizzy API Token** — Generate from account settings
- **GitHub Repository** — The codebase you want the AI to work on
- **GitHub CLI** — Install with `brew install gh` or [see docs](https://cli.github.com/)
- **Fizzy MCP configured** — In your AI editor (Claude Code, Cursor, etc.)

## Step 1: Install and Configure

Run the interactive configuration:

```bash
npx fizzy-do-mcp@latest configure
```

This will:
1. Prompt for your Fizzy API token (if not already set)
2. Verify your token works
3. Configure your AI editor automatically

## Step 2: Create a Config Card

Every vibe-enabled board needs a **config card** that links it to a GitHub repository.

1. Open your board in Fizzy
2. Create a new card titled exactly: `vibe config`
3. In the description, add YAML configuration:

```yaml
repository: owner/repo-name
default_branch: main
branch_pattern: ai/{card_number}-{slug}
auto_assign_pr: true
```

4. Tag the card with `#ai-config`
5. Save the card (it can stay in any column)

See the [Config Card Reference](./config-card) for all available options.

## Step 3: Set Up Columns

Vibe Coding uses board columns to track card status. Create these columns on your board:

| Column | Color | Purpose |
|--------|-------|---------|
| To Do | Blue | Ready for AI to pick up (trigger column) |
| In Progress | Yellow | AI is currently working |
| Maybe | Gray | Ideas, not ready for AI |
| Blocked | Pink | Failed, needs human help |

::: tip Trigger Columns
Cards in `To Do`, `Ready`, or `Accepted` columns are eligible for AI pickup. Use whichever name fits your workflow.
:::

## Step 4: Tag Your Cards

Cards need special tags to be picked up by Vibe Coding:

### `#ai-code`
Use for cards that should be implemented directly:
- Bug fixes with clear reproduction steps
- Features with detailed requirements
- Refactoring tasks
- Test additions

### `#ai-plan`
Use for larger tasks that need breakdown:
- Multi-file features
- Complex refactors
- Tasks with unclear scope

Tag the card and move it to your trigger column (`To Do`) when ready.

## Step 5: Auto-Accept Fizzy Tools (Recommended)

By default, your AI editor will prompt for permission on every Fizzy MCP tool call. For a smooth vibe coding experience, configure auto-accept:

### Claude Code

Add to your project's `.claude/settings.json`:

```json
{
  "permissions": {
    "allow": ["mcp__fizzy__*"]
  }
}
```

This auto-approves all Fizzy MCP tools without prompts.

For fully autonomous operation (CI/CD or scripted):

```bash
claude -p "Start vibe coding with Fizzy" --allowedTools "mcp__fizzy__*"
```

### Other Editors

Check your editor's MCP documentation for permission configuration options.

## Step 6: Start Vibe Coding

Tell your AI assistant to start processing work:

```
You: Let's start vibe coding with Fizzy

AI: [checks for pending work tagged #ai-code or #ai-plan]
    Found 3 items in the queue...
    Claiming #42 "Add dark mode support"...
```

The AI will:

1. **Check** for cards tagged `#ai-code` or `#ai-plan` in trigger columns
2. **Claim** the first available work item
3. **Read** the card description for requirements
4. **Implement** the changes (code, tests, commits)
5. **Create** a branch and pull request
6. **Mark complete** and add a comment with the PR link
7. **Continue** to the next card

## Environment Variables

You can also configure via environment variables:

```bash
# Required
export FIZZY_TOKEN="your-api-token"
```

## Next Steps

- [Config Card Reference](./config-card) — All configuration options
- [Workflow Columns](./columns) — Understanding the card lifecycle
- [Troubleshooting](./troubleshooting) — Common issues and solutions
