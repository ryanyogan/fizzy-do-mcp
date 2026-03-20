# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.5.0] - 2025-03-20

### Breaking Changes

- **Removed hosted MCP server** - The Cloudflare Worker at `apps/hosted/` has been removed. The project is now fully local-first.
- **Removed pending work tools** - `fizzy_pending_work_*` tools have been removed as they depended on the hosted backend.
- **Removed `HOSTED_URLS`** - The shared config no longer exports hosted service URLs.

### Changed

- **Documentation restyled** - New rainbow gradient theme with Geist Mono font and "tech grit" aesthetic
- **Dynamic version display** - Documentation nav now shows the current CLI version from package.json
- **CLI version sync** - CLI now reads version dynamically from package.json instead of hardcoded values

### Added

- **Changesets integration** - Added [@changesets/cli](https://github.com/changesets/changesets) for automated versioning and releases
- **Release workflow** - New GitHub Actions workflow for automated npm publishing via Changesets
- **Deployment documentation** - README now includes comprehensive deployment, versioning, and CI/CD docs

### Removed

- Deleted `apps/hosted/` directory (Cloudflare Worker, webhooks, pending work queue)
- Deleted `packages/tools/src/pending-work/` (pending work tool definitions)
- Deleted `packages/shared/src/schemas/pending-work.ts`
- Deleted `docs/vibe-coding/` directory (5 files)
- Deleted `docs/tools/pending-work/overview.md`
- Removed hosted proxy sections from editor configuration docs

## [0.4.0] - 2025-03-19

### Added

- Pending work queue with KV-backed storage
- Webhook integration for AI work assignment
- Multi-tenant webhook secret management

## [0.3.0] - 2025-03-18

### Changed

- Migrated to Vite+ unified toolchain
- Renamed package to `fizzy-do-mcp`

## [0.1.0] - 2024-03-11

### Added

- Initial release of Fizzy MCP Server
- 40 MCP tools covering all Fizzy operations:
  - Identity & Account (2 tools)
  - Boards (7 tools)
  - Cards (18 tools)
  - Comments (5 tools)
  - Columns (5 tools)
  - Tags (1 tool)
  - Users (2 tools)
- CLI with interactive authentication flow
- Auto-detection of AI agents (Claude Desktop, Cursor, OpenCode)
- Auto-configuration option after authentication
- Beautiful CLI output with Fizzy branding
- Secure credential storage in `~/.config/fizzy-mcp/config.json`
- Environment variable support for CI/CD deployments
- Type-safe TypeScript implementation with Zod validation
- Retry logic with exponential backoff for rate limits
- Comprehensive documentation

### Security

- Config file stored with mode 600 (owner read/write only)
- Access tokens never logged or exposed in error messages
