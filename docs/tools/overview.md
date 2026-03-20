# Tools Overview

Fizzy MCP provides 70+ tools for managing your Fizzy boards, cards, and collaboration.

## Tool Categories

### Identity & Account

| Tool | Description |
|------|-------------|
| `fizzy_get_identity` | Get current user identity and accessible accounts |
| `fizzy_get_account` | Get account settings and configuration |

### Boards

| Tool | Description |
|------|-------------|
| `fizzy_list_boards` | List all boards you have access to |
| `fizzy_get_board` | Get details of a specific board |
| `fizzy_create_board` | Create a new board |
| `fizzy_update_board` | Update board settings |
| `fizzy_delete_board` | Delete a board (admin only) |
| `fizzy_publish_board` | Make a board publicly accessible |
| `fizzy_unpublish_board` | Remove public access |

### Cards

| Tool | Description |
|------|-------------|
| `fizzy_list_cards` | List cards with optional filters |
| `fizzy_get_card` | Get details of a specific card |
| `fizzy_create_card` | Create a new card |
| `fizzy_update_card` | Update card title, description, tags |
| `fizzy_delete_card` | Delete a card |
| `fizzy_close_card` | Mark a card as complete |
| `fizzy_reopen_card` | Reopen a closed card |
| `fizzy_postpone_card` | Move card to "Not Now" |
| `fizzy_triage_card` | Move card to a specific column |
| `fizzy_untriage_card` | Send card back to triage |
| `fizzy_tag_card` | Toggle a tag on a card |
| `fizzy_assign_card` | Toggle user assignment |
| `fizzy_watch_card` | Subscribe to card notifications |
| `fizzy_unwatch_card` | Unsubscribe from notifications |
| `fizzy_pin_card` | Pin card for quick access |
| `fizzy_unpin_card` | Unpin a card |
| `fizzy_mark_golden` | Mark card as important |
| `fizzy_unmark_golden` | Remove golden status |

### Comments

| Tool | Description |
|------|-------------|
| `fizzy_list_comments` | List comments on a card |
| `fizzy_get_comment` | Get a specific comment |
| `fizzy_create_comment` | Add a comment to a card |
| `fizzy_update_comment` | Edit a comment |
| `fizzy_delete_comment` | Delete a comment |

### Columns

| Tool | Description |
|------|-------------|
| `fizzy_list_columns` | List columns on a board |
| `fizzy_get_column` | Get column details |
| `fizzy_create_column` | Create a new column |
| `fizzy_update_column` | Update column name/color |
| `fizzy_delete_column` | Delete a column |

### Tags & Users

| Tool | Description |
|------|-------------|
| `fizzy_list_tags` | List all tags in the account |
| `fizzy_list_users` | List all users in the account |
| `fizzy_get_user` | Get user details |

### Reactions

| Tool | Description |
|------|-------------|
| `fizzy_list_reactions` | List reactions on a card or comment |
| `fizzy_create_reaction` | Add a reaction to a card or comment |
| `fizzy_delete_reaction` | Remove a reaction |

### Steps

| Tool | Description |
|------|-------------|
| `fizzy_list_steps` | List checklist steps on a card |
| `fizzy_get_step` | Get step details |
| `fizzy_create_step` | Add a checklist step to a card |
| `fizzy_update_step` | Update step text or completion |
| `fizzy_delete_step` | Delete a step |

### Notifications

| Tool | Description |
|------|-------------|
| `fizzy_list_notifications` | List user notifications |
| `fizzy_get_notification` | Get notification details |
| `fizzy_mark_read` | Mark a notification as read |
| `fizzy_mark_all_read` | Mark all notifications as read |
| `fizzy_unread_count` | Get count of unread notifications |

### Webhooks

| Tool | Description |
|------|-------------|
| `fizzy_list_webhooks` | List configured webhooks |
| `fizzy_get_webhook` | Get webhook details |
| `fizzy_create_webhook` | Create a new webhook |
| `fizzy_update_webhook` | Update webhook settings |
| `fizzy_delete_webhook` | Delete a webhook |
| `fizzy_test_webhook` | Send a test event to a webhook |

### Pending Work

| Tool | Description |
|------|-------------|
| `fizzy_pending_work_list` | List work items in the AI queue |
| `fizzy_pending_work_get` | Get details of a work item |
| `fizzy_pending_work_claim` | Claim a work item for processing |
| `fizzy_pending_work_complete` | Mark work as completed or failed |
| `fizzy_pending_work_abandon` | Release a claimed work item |
| `fizzy_pending_work_status` | Get queue status summary |

See [Vibe Coding](/vibe-coding/) for how pending work tools enable autonomous AI coding.

## Common Parameters

### Card Filters

When listing cards, you can filter by:

| Parameter | Type | Description |
|-----------|------|-------------|
| `board_ids` | `string[]` | Filter by board(s) |
| `tag_ids` | `string[]` | Filter by tag(s) |
| `assignee_ids` | `string[]` | Filter by assignee(s) |
| `indexed_by` | `string` | Filter by state |
| `sorted_by` | `string` | Sort order |
| `terms` | `string[]` | Search terms |

### Card States (`indexed_by`)

| Value | Description |
|-------|-------------|
| `all` | All open cards |
| `closed` | Completed cards |
| `not_now` | Postponed cards |
| `stalled` | Cards with no recent activity |
| `postponing_soon` | Cards about to auto-postpone |
| `golden` | Important/golden cards |

### Sort Orders (`sorted_by`)

| Value | Description |
|-------|-------------|
| `latest` | Most recently updated first |
| `newest` | Most recently created first |
| `oldest` | Oldest created first |

## Example Usage

### List Cards on a Board

```
AI calls: fizzy_list_cards
Parameters: { board_ids: ["board_123"] }

Returns: Array of cards with titles, tags, assignees, status
```

### Create a Card

```
AI calls: fizzy_create_card
Parameters: {
  board_id: "board_123",
  title: "Implement feature X",
  description: "## Requirements\n- Item 1\n- Item 2",
  tag_ids: ["tag_456", "tag_789"]
}

Returns: Created card with number, URL
```

### Move Card to Column

```
AI calls: fizzy_triage_card
Parameters: {
  card_number: 123,
  column_id: "col_456"
}

Returns: Updated card
```

### Add Comment

```
AI calls: fizzy_create_comment
Parameters: {
  card_number: 123,
  body: "Progress update: Feature is 80% complete"
}

Returns: Created comment
```

## Markdown Support

Card descriptions and comments support:

- **Bold** and *italic* text
- [Links](https://example.com)
- Bullet and numbered lists
- `inline code` and code blocks
- Basic HTML

## Error Handling

All tools return consistent error formats:

```json
{
  "error": true,
  "message": "Card not found",
  "code": "NOT_FOUND"
}
```

Common error codes:
- `NOT_FOUND` - Resource doesn't exist
- `FORBIDDEN` - No permission
- `INVALID_INPUT` - Bad parameters
- `RATE_LIMITED` - Too many requests

## Next Steps

- [Getting Started](/getting-started/introduction) - Initial setup
- [Workflows](/workflows/ai-driven-tasks) - Real-world examples
- [Configuration](/configuration/claude-desktop) - Editor setup
