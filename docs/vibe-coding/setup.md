# Setup Guide

Get Vibe Coding running in your project in about 5 minutes.

## Prerequisites

Before starting, ensure you have:

- **Fizzy Account** — Sign up at [fizzy.do](https://fizzy.do)
- **Fizzy API Token** — Generate from account settings
- **GitHub Repository** — The codebase you want the AI to work on
- **GitHub CLI** — Install with `brew install gh` or [see docs](https://cli.github.com/)
- **Claude Code** — Install with `npm install -g @anthropic-ai/claude-code`
- **Node.js 18+** — For running the Fizzy MCP CLI

## Step 1: Install and Configure

Run the interactive configuration:

```bash
npx fizzy-do-mcp@latest configure
```

This will:
1. Prompt for your Fizzy API token (if not already set)
2. Verify your token works
3. Save configuration to `~/.config/fizzy/config.json`

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

4. Save the card (it can stay in any column)

See the [Config Card Reference](./config-card) for all available options.

## Step 3: Set Up Standard Columns

Vibe Coding uses specific columns to track card status. Create these columns on your board:

| Column | Color | Purpose |
|--------|-------|---------|
| Maybe | Gray | Ideas, not ready for AI |
| Accepted | Blue | Ready for AI to pick up |
| In Progress | Yellow | AI is currently working |
| Blocked | Pink | Failed, needs human help |

::: tip Auto-Creation
If these columns don't exist when you start vibe mode, they'll be created automatically with the correct colors.
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

Add the tag and move the card to "Accepted" when ready.

## Step 5: Configure Webhooks (Optional)

For automatic card pickup when cards are moved or tagged, configure Fizzy webhooks:

1. Go to your Fizzy account settings
2. Navigate to **Integrations** or **Webhooks**
3. Add a new webhook with:
   - **URL**: `https://mcp.fizzy.yogan.dev/webhooks/fizzy`
   - **Events**: Select all card events (card_triaged, card_published, card_closed, etc.)
   - **Secret** (optional): Generate a secret for signature verification

::: info Webhook Events
The webhook handler processes these events:
- `card_triaged` — Card moved to a column (triggers work if moved to "To Do"/"Accepted")
- `card_published` — New card created with AI tags
- `comment_created` — Detects `@ai start` commands
- `card_closed` / `card_postponed` — Cancels pending work
:::

Without webhooks, Vibe Coding still works — the CLI will poll for available work when connected.

## Step 6: Start Vibe Mode

Navigate to your repository and run:

```bash
cd /path/to/your/repo
npx fizzy-do-mcp --vibe
```

You can also specify a board directly:

```bash
npx fizzy-do-mcp --vibe --board "board-name-or-id"
```

### Interactive Board Selection

If your account has multiple boards with config cards, you'll see a selection prompt:

```
? Select a board to vibe with:
  ❯ my-app (owner/my-app)
    side-project (owner/side-project)
    experiments (owner/experiments)
```

### What Happens Next

Once started, Vibe Coding will:

1. **Connect** to Fizzy via WebSocket for real-time updates
2. **Verify** the config card and repository match your current directory
3. **Scan** for cards tagged `#ai-code` or `#ai-plan` in "Accepted"
4. **Pick up** the first available card
5. **Move** it to "In Progress"
6. **Spawn** Claude Code to implement the card
7. **Create** a branch, commits, and pull request
8. **Close** the card and link to the PR
9. **Continue** to the next card

## Environment Variables

You can also configure via environment variables:

```bash
# Required
export FIZZY_TOKEN="your-api-token"

# Optional
export FIZZY_BOARD_ID="specific-board-id"  # Skip board selection
export FIZZY_LOG_LEVEL="debug"              # Enable debug logging
```

## Verifying Setup

Test your configuration without processing cards:

```bash
npx fizzy-do-mcp --vibe --dry-run
```

This validates:
- API token is valid
- Board has a config card
- Repository matches current directory
- Required columns exist
- Shows cards that would be picked up

## Next Steps

- [Config Card Reference](./config-card) — All configuration options
- [Workflow Columns](./columns) — Understanding the card lifecycle
- [Troubleshooting](./troubleshooting) — Common issues and solutions
