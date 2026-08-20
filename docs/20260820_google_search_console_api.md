# Google Search Console API library and CLI

## Goal

Reimplement the current Google Search Console API as a validated TypeScript library and `@stricli/core` CLI, using Valibot and `@adaptive-ds/result`, with every endpoint/purpose isolated in its own `src/` subfolder.

## Decisions

- Use the current `searchconsole:v1` discovery surface and `https://searchconsole.googleapis.com` host.
- Keep Google's currently advertised `/webmasters/v3` route paths for Sites, Sitemaps, and Search Analytics; use `/v1` routes for URL Inspection and Mobile-Friendly Testing.
- Treat OAuth bearer credentials and the Mobile-Friendly Testing API key as distinct validated client configuration; Mobile-Friendly Testing selects the API key when both are present and otherwise uses OAuth.
- Follow the `code-style` skill: bounded contexts, subject-first names, one primary export per file, `Result` for fallible operations, and view-only TSX if applicable.
- Preserve a stable library root while exposing explicit endpoint modules and a package CLI binary.
- Validate client configuration, CLI arguments, endpoint inputs, API responses, and structured API errors.

## Approach

- Model shared transport, credentials, errors, and validation independently from endpoint domains.
- Implement all discovery endpoints: Sites, Sitemaps, Search Analytics, URL Inspection, and Mobile-Friendly Testing.
- Compose endpoint-specific CLI commands into nested route maps and render machine-readable JSON with reliable exit codes.
- Verify schemas, transport behavior, every endpoint, exports/build output, and CLI parsing/execution with Bun tests and static checks.

## Tasks

- [x] 1. Establish package dependencies, shared Result-safe client/configuration, transport, API error handling, and common validators.
- [x] 2. Implement Sites endpoint folders, schemas, library exports, tests, and CLI commands.
- [x] 3. Implement Sitemaps endpoint folders, schemas, library exports, tests, and CLI commands.
- [x] 4. Implement Search Analytics endpoint folder, complete schemas and pagination inputs, library exports, tests, and CLI command.
- [x] 5. Implement URL Inspection endpoint folder, complete schemas, library exports, tests, and CLI command.
- [x] 6. Implement Mobile-Friendly Testing endpoint folder, API-key transport support, complete schemas, library exports, tests, and CLI command.
- [x] 7. Compose the `@stricli/core` application and binary, package exports, credential/config loading, output/error behavior, and CLI tests.
- [x] 8. Remove superseded flat implementation, update documentation, and run full formatting, typecheck, test, build, package, and CLI smoke verification.

## Paths

- `src/shared/`
- `src/sites/`
- `src/sitemaps/`
- `src/searchAnalytics/`
- `src/urlInspection/`
- `src/mobileFriendlyTest/`
- `src/cli/`
- `src/index.ts`
- `test/`
- `package.json`
- `README.md`
