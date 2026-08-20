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

## OAuth refresh-token authentication

The library's validated client configuration accepts an optional `oauth` object alongside `accessToken` and `mobileFriendlyApiKey`:

```typescript
{
  oauth: {
    clientId: "<client-id>",
    clientSecret: "<client-secret>",
    refreshToken: "<refresh-token>",
    tokenUrl: "https://oauth2.googleapis.com/token",
  },
}
```

`clientId`, `clientSecret`, and `refreshToken` are required. `tokenUrl` is optional and defaults to `https://oauth2.googleapis.com/token`. The OAuth schema and its `GoogleSearchConsoleOAuthConfig` and `GoogleSearchConsoleOAuthConfigInput` types are public exports.

The CLI maps these OAuth environment variables:

- `GOOGLE_SEARCH_CONSOLE_OAUTH_CLIENT_ID`
- `GOOGLE_SEARCH_CONSOLE_OAUTH_CLIENT_SECRET`
- `GOOGLE_SEARCH_CONSOLE_OAUTH_REFRESH_TOKEN`
- `GOOGLE_SEARCH_CONSOLE_OAUTH_TOKEN_URL` (optional)

Direct environment values take precedence over the same values in `--env-file`; the dotenv parser supports `KEY=value`, optional `export`, quoted values, comments, and blank lines. There are no OAuth-specific CLI flags. A credentials JSON file can express OAuth either as nested camelCase `oauth` fields or as Google's flat authorized-user fields:

```json
{
  "oauth": {
    "clientId": "<client-id>",
    "clientSecret": "<client-secret>",
    "refreshToken": "<refresh-token>",
    "tokenUrl": "https://oauth2.googleapis.com/token"
  }
}
```

```json
{
  "client_id": "<client-id>",
  "client_secret": "<client-secret>",
  "refresh_token": "<refresh-token>",
  "token_uri": "https://oauth2.googleapis.com/token"
}
```

For each OAuth field, CLI precedence is direct environment, dotenv, nested `oauth` JSON, then flat authorized-user JSON. In the shared request path, a static `accessToken` takes precedence over refresh OAuth; the Mobile-Friendly API key remains an independent authentication mode.

Refreshes use a POST form-encoded request containing `client_id`, `client_secret`, `grant_type=refresh_token`, and `refresh_token`. The returned access token is cached in memory per client until 60 seconds before expiry, and concurrent refreshes share one in-flight request. An OAuth-backed API request retries once after `401` by invalidating the cached token and refreshing it. Static-token requests do not refresh or use this retry. No interactive authorization flow or refreshed-token persistence is implemented, and OAuth errors do not expose credential or token values.

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
