# TypeScript Client

The `@fizzy-do-mcp/client` package provides a type-safe TypeScript client for the Fizzy API.

## Installation

```bash
npm install @fizzy-do-mcp/client
```

## Quick Start

```typescript
import { FizzyClient } from '@fizzy-do-mcp/client';

const client = new FizzyClient({
  accessToken: 'your-api-token',
  accountSlug: '/123456',
  baseUrl: 'https://app.fizzy.do', // optional, this is the default
});

// List boards
const boards = await client.boards.list();

// Create a card
const card = await client.cards.create('board_id', {
  title: 'My new task',
  description: 'Task description',
});
```

## Client Configuration

```typescript
interface FizzyClientConfig {
  /** Personal access token from Fizzy */
  accessToken: string;
  
  /** Account slug (e.g., "/123456") */
  accountSlug: string;
  
  /** Base URL for API (default: "https://app.fizzy.do") */
  baseUrl?: string;
}
```

## API Namespaces

The client organizes methods into namespaces:

### Identity

```typescript
// Get current user identity and accounts
const identity = await client.identity.getIdentity();
```

### Account

```typescript
// Get account settings
const settings = await client.account.getSettings();
```

### Boards

```typescript
// List all boards
const boards = await client.boards.list();

// Get a specific board
const board = await client.boards.getById('board_id');

// Create a board
const newBoard = await client.boards.create({
  name: 'My Board',
  all_access: true,
});

// Update a board
await client.boards.update('board_id', { name: 'New Name' });

// Delete a board
await client.boards.deleteBoard('board_id');

// Publish/unpublish
const publishedBoard = await client.boards.publish('board_id');
await client.boards.unpublish('board_id');
```

### Cards

```typescript
// List cards with filters
const cards = await client.cards.list({
  board_ids: ['board_1', 'board_2'],
  tag_ids: ['tag_1'],
  assignee_ids: ['user_1'],
  indexed_by: 'all',
  sorted_by: 'latest',
  terms: ['search', 'terms'],
});

// Get a specific card
const card = await client.cards.getByNumber(42);

// Create a card
const newCard = await client.cards.create('board_id', {
  title: 'New Task',
  description: '<p>HTML description</p>',
  status: 'published',
  tag_ids: ['tag_1'],
});

// Update a card
const updated = await client.cards.update(42, { title: 'Updated Title' });

// Delete a card
await client.cards.deleteCard(42);

// Card actions
await client.cards.close(42);
await client.cards.reopen(42);
await client.cards.postpone(42);
await client.cards.triage(42, 'column_id');
await client.cards.untriage(42);
await client.cards.toggleTag(42, 'bug');
await client.cards.toggleAssignment(42, 'user_id');
await client.cards.watch(42);
await client.cards.unwatch(42);
await client.cards.pin(42);
await client.cards.unpin(42);
await client.cards.markGolden(42);
await client.cards.unmarkGolden(42);
```

### Comments

```typescript
// List comments on a card
const comments = await client.comments.list(42);

// Get a specific comment
const comment = await client.comments.getById(42, 'comment_id');

// Create a comment
const newComment = await client.comments.create(42, {
  body: '<p>Comment text</p>',
});

// Update a comment
const updated = await client.comments.update(42, 'comment_id', {
  body: '<p>Updated text</p>',
});

// Delete a comment
await client.comments.deleteComment(42, 'comment_id');
```

### Columns

```typescript
// List columns on a board
const columns = await client.columns.list('board_id');

// Get a specific column
const column = await client.columns.getById('board_id', 'column_id');

// Create a column
const newColumn = await client.columns.create('board_id', {
  name: 'In Progress',
  color: 'var(--color-card-3)', // Yellow
});

// Update a column
await client.columns.update('board_id', 'column_id', {
  name: 'Review',
  color: 'var(--color-card-6)', // Violet
});

// Delete a column
await client.columns.deleteColumn('board_id', 'column_id');
```

### Tags

```typescript
// List all tags
const tags = await client.tags.list();
```

### Users

```typescript
// List all users
const users = await client.users.list();

// Get a specific user
const user = await client.users.getById('user_id');
```

## Error Handling

All client methods return a `Result` type for safe error handling:

```typescript
import { isErr, unwrap } from '@fizzy-do-mcp/shared';

const result = await client.cards.getByNumber(42);

if (isErr(result)) {
  console.error('Error:', result.error.message);
} else {
  const card = unwrap(result);
  console.log('Card:', card.title);
}
```

<script setup>
import RelatedLinks from '../.vitepress/theme/components/RelatedLinks.vue'
</script>

<RelatedLinks
  title="Related"
  :items="[
    { title: 'Error Handling', link: '/api/errors', description: 'Error types and codes' },
    { title: 'Result Type', link: '/api/result', description: 'Type-safe error handling' },
    { title: 'CLI Reference', link: '/api/cli', description: 'Command-line tools' },
    { title: 'Tools Overview', link: '/tools/overview', description: 'All MCP tools' },
  ]"
/>
