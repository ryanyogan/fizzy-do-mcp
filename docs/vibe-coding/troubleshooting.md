# Troubleshooting

Common issues and solutions for Vibe Coding.

## No Cards Found

**Problem**: AI says there are no pending work items.

**Checklist**:
- [ ] Card has `#ai-code` or `#ai-plan` tag
- [ ] Card is in a trigger column (`To Do`, `Ready`, or `Accepted`)
- [ ] Card is not a draft (status = published)
- [ ] Card is not already closed

## Config Card Not Found

**Error**: "No boards with config cards found"

**Cause**: The AI couldn't find a board with a valid config card.

**Solutions**:
1. Create a card titled "vibe config" on your board
2. Tag it with `#ai-config`
3. Ensure the card has valid YAML in the description:
   ```yaml
   repository: owner/repo-name
   ```
4. Verify your API token has access to the board

## Repository Mismatch

**Error**: "Repository mismatch: config says owner/repo but current directory is different/repo"

**Cause**: The repository in your config card doesn't match the git remote of your current directory.

**Solutions**:
1. Navigate to the correct repository
2. Or update the config card to match your current directory
3. Check your git remote:
   ```bash
   git remote -v
   ```

## PR Creation Failed

**Error**: "Failed to create pull request"

**Causes & Solutions**:

### GitHub CLI Not Authenticated
```bash
gh auth status
# If not authenticated:
gh auth login
```

### No Push Access
Verify you have push access to the repository:
```bash
git push --dry-run origin HEAD
```

### Branch Already Exists
The branch name from `branch_pattern` already exists. Either:
- Delete the existing branch
- Add `{timestamp}` to your branch pattern for uniqueness

### PR Template Error
If using a custom `pr_template`, check for syntax errors in the YAML.

## Permission Prompts Interrupting Flow

**Problem**: AI keeps asking for permission to use Fizzy tools.

**Solution**: Configure auto-accept for Fizzy MCP tools.

### Claude Code
Add to `.claude/settings.json`:
```json
{
  "permissions": {
    "allow": ["mcp__fizzy__*"]
  }
}
```

### Claude Code (Headless)
```bash
claude -p "Start vibe coding" --allowedTools "mcp__fizzy__*"
```

See the [Setup Guide](./setup#step-5-auto-accept-fizzy-tools-recommended) for more options.

## Claude Code Errors

**Error**: "Claude Code exited with error"

**Common causes**:

### API Key Issues
```bash
# Verify Claude Code works standalone
claude --version
```

### Context Too Large
The card description or codebase is too large for the context window. Try:
- Simplifying the card description
- Breaking into smaller cards with `#ai-plan`
- Excluding large files in `.claudeignore`

### Tool Execution Failed
Claude Code couldn't run a required tool (git, npm, etc.). Check:
```bash
which git npm node
```

## Invalid Config Card

**Error**: "Invalid YAML in config card"

**Cause**: The YAML in your config card has syntax errors.

**Common YAML issues**:
- Missing quotes around values with special characters
- Incorrect indentation
- Tabs instead of spaces

**Validate your config**:
```bash
cat << 'EOF' | yq .
repository: owner/repo
default_branch: main
EOF
```

## Cards Stuck in Progress

**Problem**: Cards stay in "In Progress" even though the AI stopped working.

**Cause**: The AI session ended before completing the card.

**Solution**:
1. Manually move the card back to "To Do"
2. Check for any partial branches:
   ```bash
   git branch -a | grep ai/
   ```
3. Delete partial branches if needed:
   ```bash
   git branch -D ai/42-partial-work
   git push origin --delete ai/42-partial-work
   ```

## Too Many Blocked Cards

**Problem**: Cards keep landing in "Blocked" column.

**Diagnosis**:
1. Read the AI comments on blocked cards
2. Look for patterns (test failures, type errors, etc.)

**Common fixes**:
- Add clearer requirements to card descriptions
- Include acceptance criteria
- Mention specific files to modify
- Add test expectations

## Webhooks Not Working

**Problem**: Cards aren't automatically queued when moved to trigger columns.

**Checklist**:
- [ ] Webhook URL is configured in Fizzy account settings
- [ ] Card events are enabled (card_triaged, card_published, card_closed)

**Note**: Webhooks are optional — your AI assistant can always check for work manually via MCP tools.

## Getting Help

If you're still stuck:

1. **GitHub Issues**: [Report a bug](https://github.com/ryanyogan/fizzy-do-mcp/issues)
2. **Check the card comments**: The AI leaves diagnostic info when work fails
