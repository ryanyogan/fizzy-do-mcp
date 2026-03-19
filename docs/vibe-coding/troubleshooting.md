# Troubleshooting

Common issues and solutions for Vibe Coding.

## No Boards Found

**Error**: "No boards with config cards found"

**Cause**: Vibe Coding couldn't find any boards with a valid config card.

**Solutions**:
1. Create a config card titled "vibe config" on your board
2. Ensure the card has valid YAML in the description:
   ```yaml
   repository: owner/repo-name
   ```
3. Verify your API token has access to the board

## Repository Mismatch

**Error**: "Repository mismatch: config says owner/repo but current directory is different/repo"

**Cause**: The repository in your config card doesn't match the git remote of your current directory.

**Solutions**:
1. Navigate to the correct repository:
   ```bash
   cd /path/to/owner/repo
   npx fizzy-do-mcp --vibe
   ```
2. Or update the config card to match your current directory
3. Check your git remote:
   ```bash
   git remote -v
   ```

## Card Not Picked Up

**Problem**: Cards in "Accepted" aren't being picked up by Vibe Coding.

**Checklist**:
- [ ] Card has `#ai-code` or `#ai-plan` tag
- [ ] Card is in the "Accepted" column (not Maybe, Triage, etc.)
- [ ] Card is not a draft (status = published)
- [ ] Vibe Coding is running and connected

**Debug**:
```bash
npx fizzy-do-mcp --vibe --log-level debug
```

Look for "Scanning for cards..." in the output.

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

## WebSocket Disconnected

**Error**: "WebSocket connection lost" or "Reconnecting..."

**Cause**: Network interruption or Fizzy service issue.

**Behavior**: Vibe Coding automatically reconnects with exponential backoff.

**If reconnection fails**:
1. Check your internet connection
2. Verify Fizzy is accessible: `curl https://fizzy.do/api/health`
3. Restart Vibe Coding

## Claude Code Errors

**Error**: "Claude Code exited with error"

**Common causes**:

### API Key Issues
```bash
# Verify Claude Code works standalone
claude-code --version
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

**Debug**:
```bash
# Copy your config and validate
cat << 'EOF' | yq .
repository: owner/repo
default_branch: main
EOF
```

**Common YAML issues**:
- Missing quotes around values with special characters
- Incorrect indentation
- Tabs instead of spaces

## Cards Stuck in Progress

**Problem**: Cards stay in "In Progress" even though Vibe Coding stopped.

**Cause**: Vibe Coding was terminated before completing the card.

**Solution**:
1. Manually move the card back to "Accepted"
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

## Debug Mode

Enable verbose logging for detailed diagnostics:

```bash
npx fizzy-do-mcp --vibe --log-level debug
```

This shows:
- WebSocket connection events
- Card pickup decisions
- Claude Code spawning
- Git operations
- API calls

## Dry Run Mode

Test configuration without processing cards:

```bash
npx fizzy-do-mcp --vibe --dry-run
```

Output includes:
- Configuration validation
- Columns that would be created
- Cards that would be picked up
- Repository verification

## Getting Help

If you're still stuck:

1. **Check the logs**: Run with `--log-level debug`
2. **GitHub Issues**: [Report a bug](https://github.com/ryanyogan/fizzy-do-mcp/issues)
3. **Discord**: Join the [Fizzy community](https://discord.gg/fizzy)

When reporting issues, include:
- Error message
- Debug log output
- Config card contents (redact sensitive info)
- Node.js version (`node --version`)
- Operating system
