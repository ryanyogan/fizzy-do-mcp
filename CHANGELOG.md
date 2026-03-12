# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
