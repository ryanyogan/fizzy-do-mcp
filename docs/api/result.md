# Result Type

Fizzy MCP uses a `Result` type for operations that can fail. This provides type-safe error handling without throwing exceptions.

## Overview

```typescript
type Result<T, E> = Ok<T> | Err<E>;

interface Ok<T> {
  ok: true;
  value: T;
}

interface Err<E> {
  ok: false;
  error: E;
}
```

## Creating Results

### Success

```typescript
import { ok } from '@fizzy-do-mcp/shared';

const result = ok({ id: '123', name: 'My Board' });
// Type: Result<{ id: string; name: string }, never>
```

### Error

```typescript
import { err } from '@fizzy-do-mcp/shared';

const result = err({ code: 'NOT_FOUND', message: 'Board not found' });
// Type: Result<never, { code: string; message: string }>
```

## Type Guards

### isOk

Check if result is successful:

```typescript
import { isOk } from '@fizzy-do-mcp/shared';

const result = await client.boards.list();

if (isOk(result)) {
  // TypeScript knows result.value is Board[]
  console.log(result.value);
}
```

### isErr

Check if result is an error:

```typescript
import { isErr } from '@fizzy-do-mcp/shared';

const result = await client.cards.getByNumber(42);

if (isErr(result)) {
  // TypeScript knows result.error is FizzyError
  console.log(result.error.message);
}
```

## Unwrapping

### unwrap

Get the value or throw if error:

```typescript
import { unwrap } from '@fizzy-do-mcp/shared';

const result = await client.boards.list();
const boards = unwrap(result); // Throws if error
```

### unwrapOr

Get the value or return a default:

```typescript
import { unwrapOr } from '@fizzy-do-mcp/shared';

const result = await client.cards.list();
const cards = unwrapOr(result, []); // Returns [] if error
```

### unwrapErr

Get the error or throw if success:

```typescript
import { unwrapErr } from '@fizzy-do-mcp/shared';

const result = await client.boards.deleteBoard('invalid_id');
const error = unwrapErr(result); // Throws if success
```

## Pattern Matching

### match

Handle both cases with a single call:

```typescript
import { match } from '@fizzy-do-mcp/shared';

const result = await client.cards.getByNumber(42);

const message = match(result, {
  ok: (card) => `Found: ${card.title}`,
  err: (error) => `Error: ${error.message}`,
});
```

### matchAsync

Async version for async handlers:

```typescript
import { matchAsync } from '@fizzy-do-mcp/shared';

const result = await client.boards.getById('board_id');

await matchAsync(result, {
  ok: async (board) => {
    await saveToCache(board);
  },
  err: async (error) => {
    await logError(error);
  },
});
```

## Transformations

### map

Transform the success value:

```typescript
import { map } from '@fizzy-do-mcp/shared';

const result = await client.boards.list();
const names = map(result, (boards) => boards.map((b) => b.name));
// Type: Result<string[], FizzyError>
```

### mapErr

Transform the error:

```typescript
import { mapErr } from '@fizzy-do-mcp/shared';

const result = await client.cards.getByNumber(42);
const mapped = mapErr(result, (error) => ({
  ...error,
  timestamp: new Date(),
}));
```

### flatMap

Chain operations that return Results:

```typescript
import { flatMap } from '@fizzy-do-mcp/shared';

const result = await client.boards.getById('board_id');
const columnsResult = flatMap(result, (board) => 
  client.columns.list(board.id)
);
```

## Combining Results

### combine

Combine multiple results into one:

```typescript
import { combine } from '@fizzy-do-mcp/shared';

const results = await Promise.all([
  client.boards.getById('board_1'),
  client.boards.getById('board_2'),
]);

const combined = combine(results);
// Type: Result<Board[], FizzyError>
// Returns first error if any fail
```

## Best Practices

1. **Prefer type guards over unwrap**: Use `isOk`/`isErr` for explicit handling
2. **Use `unwrapOr` for optional data**: Provide sensible defaults
3. **Use `match` for exhaustive handling**: Ensures both cases are handled
4. **Chain with `flatMap`**: Compose operations that can fail

<script setup>
import RelatedLinks from '../.vitepress/theme/components/RelatedLinks.vue'
</script>

<RelatedLinks
  title="Related"
  :items="[
    { title: 'Error Handling', link: '/api/errors', description: 'Error types and codes' },
    { title: 'TypeScript Client', link: '/api/client', description: 'Full API reference' },
    { title: 'Tools Overview', link: '/tools/overview', description: 'All MCP tools' },
  ]"
/>
