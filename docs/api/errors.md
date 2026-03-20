# Error Handling

Fizzy MCP uses a functional error handling approach with the `Result` type. This provides type-safe error handling without exceptions.

## Error Types

### FizzyError

The base error type for all Fizzy API errors.

```typescript
interface FizzyError {
  /** Error code for programmatic handling */
  code: ErrorCode;
  
  /** Human-readable error message */
  message: string;
  
  /** HTTP status code (if applicable) */
  status?: number;
  
  /** Original error (if wrapping another error) */
  cause?: Error;
}
```

### Error Codes

| Code | Description |
|------|-------------|
| `UNAUTHORIZED` | Invalid or expired API token |
| `FORBIDDEN` | No permission to access resource |
| `NOT_FOUND` | Resource does not exist |
| `VALIDATION_ERROR` | Invalid request parameters |
| `RATE_LIMITED` | Too many requests |
| `SERVER_ERROR` | Internal server error |
| `NETWORK_ERROR` | Network connectivity issue |
| `UNKNOWN` | Unexpected error |

## Handling Errors

### Using Type Guards

```typescript
import { isErr, isOk, unwrap } from '@fizzy-do-mcp/shared';

const result = await client.cards.getByNumber(42);

if (isErr(result)) {
  const error = result.error;
  
  switch (error.code) {
    case 'NOT_FOUND':
      console.log('Card not found');
      break;
    case 'UNAUTHORIZED':
      console.log('Please check your API token');
      break;
    case 'RATE_LIMITED':
      console.log('Too many requests, please wait');
      break;
    default:
      console.log('Error:', error.message);
  }
} else {
  const card = unwrap(result);
  console.log('Found card:', card.title);
}
```

### Using Pattern Matching

```typescript
import { match } from '@fizzy-do-mcp/shared';

const result = await client.boards.list();

match(result, {
  ok: (boards) => {
    console.log(`Found ${boards.length} boards`);
  },
  err: (error) => {
    console.error(`Failed: ${error.message}`);
  },
});
```

### Unwrapping with Default

```typescript
import { unwrapOr } from '@fizzy-do-mcp/shared';

const result = await client.cards.list({ board_ids: ['board_1'] });
const cards = unwrapOr(result, []); // Returns empty array on error
```

## HTTP Status Mapping

| Status | Error Code | Description |
|--------|------------|-------------|
| 401 | `UNAUTHORIZED` | Invalid API token |
| 403 | `FORBIDDEN` | Access denied |
| 404 | `NOT_FOUND` | Resource not found |
| 422 | `VALIDATION_ERROR` | Invalid parameters |
| 429 | `RATE_LIMITED` | Rate limit exceeded |
| 500+ | `SERVER_ERROR` | Server error |

## Retry Strategy

For rate limiting and network errors, implement exponential backoff:

```typescript
async function withRetry<T>(
  fn: () => Promise<Result<T, FizzyError>>,
  maxRetries = 3
): Promise<Result<T, FizzyError>> {
  let lastError: FizzyError | undefined;
  
  for (let i = 0; i < maxRetries; i++) {
    const result = await fn();
    
    if (isOk(result)) {
      return result;
    }
    
    lastError = result.error;
    
    if (lastError.code !== 'RATE_LIMITED' && lastError.code !== 'NETWORK_ERROR') {
      return result; // Don't retry other errors
    }
    
    // Exponential backoff
    await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
  }
  
  return err(lastError!);
}
```

<script setup>
import RelatedLinks from '../.vitepress/theme/components/RelatedLinks.vue'
</script>

<RelatedLinks
  title="Related"
  :items="[
    { title: 'Result Type', link: '/api/result', description: 'Type-safe error handling' },
    { title: 'TypeScript Client', link: '/api/client', description: 'Full API reference' },
    { title: 'CLI Reference', link: '/api/cli', description: 'Command-line tools' },
  ]"
/>
