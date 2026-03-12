# Contributing to Fizzy MCP Server

Thank you for your interest in contributing to the Fizzy MCP Server!

## Development Setup

### Prerequisites

- Node.js 20+
- pnpm 9+

### Getting Started

1. Fork and clone the repository:
   ```bash
   git clone https://github.com/ryanyogan/fizzy-mcp.git
   cd fizzy-mcp
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Build all packages:
   ```bash
   pnpm build
   ```

4. Run tests:
   ```bash
   pnpm test
   ```

## Project Structure

```
fizzy-mcp/
├── packages/
│   ├── shared/     # Types, schemas, Result type, errors
│   ├── client/     # Type-safe HTTP client for Fizzy API
│   └── tools/      # MCP tool definitions
├── apps/
│   └── server/     # MCP server and CLI
└── docs/           # Documentation site (Astro Starlight)
```

## Development Workflow

### Making Changes

1. Create a new branch for your changes:
   ```bash
   git checkout -b feature/my-feature
   ```

2. Make your changes and ensure:
   - All tests pass: `pnpm test`
   - Type checking passes: `pnpm typecheck`
   - Linting passes: `pnpm lint`
   - Code is formatted: `pnpm format`

3. Commit your changes with a descriptive message

4. Push and create a pull request

### Running Locally

```bash
# Build and run the CLI
pnpm build
cd apps/server
node dist/cli.js auth

# Test the MCP server
node dist/index.js
```

### Adding New Tools

1. Add the API method to `packages/client/src/api/`
2. Add the tool definition to `packages/tools/src/tools/`
3. Register the tool in `packages/tools/src/index.ts`
4. Add tests for the new functionality
5. Update documentation

## Code Style

- TypeScript strict mode enabled
- ESM modules only
- Use Zod for runtime validation
- Use the `Result` type for error handling (no throwing)
- Follow existing patterns in the codebase

## Testing

We use Vitest for testing. Run tests with:

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch
```

## Documentation

Documentation lives in the `docs/` directory and is built with Astro Starlight.

```bash
cd docs
pnpm dev     # Start dev server
pnpm build   # Build for production
```

## Releasing

Releases are managed by the maintainers. If you're a maintainer:

1. Update version in `apps/server/package.json`
2. Update `CHANGELOG.md`
3. Create a git tag
4. Publish to npm

## Questions?

Feel free to open an issue for any questions or concerns.
