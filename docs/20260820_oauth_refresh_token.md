# OAuth refresh-token support

## Goal

Allow library and CLI users to authenticate with a Google OAuth client ID, client secret, and refresh token, automatically obtaining and refreshing short-lived access tokens.

## Decisions

- Support a typed `oauth` library configuration with client ID, client secret, refresh token, and optional token URL.
- Accept Google authorized-user credential fields (`client_id`, `client_secret`, `refresh_token`, `token_uri`) in the default credentials JSON, alongside a nested camelCase `oauth` form.
- Support corresponding `GOOGLE_SEARCH_CONSOLE_OAUTH_*` environment variables and dotenv values.
- Keep static access tokens higher precedence than refresh credentials; keep Mobile-Friendly API-key authentication separate.
- Use Google's form-encoded token exchange, cache tokens in memory until shortly before expiry, deduplicate concurrent refreshes, and retry one API request after a refreshed-token `401`.
- Never include client secrets, refresh tokens, or returned access tokens in errors or logs.
- Do not add an interactive authorization flow or persist refreshed access tokens.

## Approach

- Extend validated public and CLI credential schemas.
- Add an isolated OAuth token provider using the existing fetch and Result conventions.
- Resolve bearer tokens in the shared request path and retry once after an authentication failure.
- Add focused shared, client, and CLI tests.
- Document library, environment, dotenv, and JSON usage, including how to combine Google installed-app client credentials with a refresh token into authorized-user JSON.

## Tasks

- [x] 1. Add OAuth configuration and token-response schemas/types.
- [x] 2. Implement the refresh-token provider with caching and concurrency deduplication.
- [x] 3. Integrate refreshed bearer tokens and one-time 401 retry into shared requests.
- [x] 4. Add CLI credential JSON and environment loading with defined precedence.
- [x] 5. Add shared and client OAuth tests.
- [x] 6. Add CLI OAuth credential-loading tests.
- [x] 7. Update README and architecture documentation.
- [x] 8. Run the full verification suite and review the complete diff.

## Paths

- `src/shared/googleSearchConsoleConfigSchema.ts`
- `src/shared/GoogleSearchConsoleClient.ts`
- `src/shared/googleSearchConsoleClientCreate.ts`
- `src/shared/googleSearchConsoleOAuthTokenResolve.ts`
- `src/shared/googleSearchConsoleRequest.ts`
- `src/cli/googleSearchConsoleCliConfigCreate.ts`
- `src/index.ts`
- `test/shared/googleSearchConsoleShared.test.ts`
- `test/googleSearchConsoleClient.test.ts`
- `test/cli/googleSearchConsoleCli.test.ts`
- `README.md`
- `docs/20260820_google_search_console_api.md`
- `docs/20260820_default_credentials_file.md`

## Current context

- Public OAuth configuration and token-response schemas/types are implemented; OAuth now satisfies client credential validation while existing credentials remain supported.
- The OAuth provider performs safe form-encoded refreshes with a 60-second expiry margin, client-scoped caching, and in-flight refresh deduplication.
- Shared requests now use refreshed OAuth bearer tokens when needed and retry one OAuth-backed request after a `401`; static tokens and API keys retain precedence and isolation.
- CLI loading accepts nested OAuth or flat Google authorized-user JSON and direct/dotenv OAuth variables, rejecting incomplete credentials without exposing values.
- Shared/client tests cover validation, exchange encoding, caching/expiry, concurrency, safe failures, auth precedence/isolation, and one-time retry.
- CLI tests cover nested and authorized-user JSON, environment/dotenv sources and precedence, defaults, invalid partial credentials, and secret-safe errors.
- README and architecture docs describe all supported OAuth sources/shapes, runtime behavior, security permissions, and combining installed-app credentials with a refresh token.
- Verification follow-up fixed field-level nested/flat OAuth fallback and ensures incomplete lower-priority OAuth values do not invalidate a usable static access token.
- OAuth refresh failures now retain the calling API operation while preserving safe structured error metadata.
- The README library example now validates required environment values before constructing typed OAuth configuration.
- OAuth bearer values are redacted from structured and unstructured API error responses, including retry paths.
- API errors also redact configured OAuth client secrets and refresh tokens while retaining non-secret diagnostics.
- Final review found no blockers; formatting, 63 tests, checks, build, Biome, and diff hygiene all pass.
