# CLI OAuth login

## Goal

Add one `google-search-console auth login` command that authorizes Search Console, verifies the exact `https://www.googleapis.com/auth/webmasters` scope, and securely saves refresh credentials to the configured credentials path or the existing default path.

## Decisions

- Normal mode opens the Google authorization page and completes through a loopback callback without reading stdin.
- Agent mode uses `--agent` to create a pending PKCE flow, print JSON with the authorization URL, and exit immediately; a later `auth login --callback-url <complete-url>` invocation completes it.
- Use authorization-code PKCE, random state, a loopback redirect on `127.0.0.1`, offline access, and consent prompting.
- Request and accept exactly the `https://www.googleapis.com/auth/webmasters` scope; do not persist credentials if it is absent.
- Save to `--credentials-file`, then `GOOGLE_SEARCH_CONSOLE_CREDENTIALS_FILE`, then `~/.config/google-search-console/credentials.json`.
- Treat desktop OAuth clients as public clients: accept an optional existing client secret but do not require one; PKCE remains mandatory in either case.
- Persist pending state and credentials atomically with restrictive permissions and never print secrets.
- Preserve unrelated credential-file settings while replacing conflicting authentication fields.
- Remove a stale file-level access token so the newly saved refresh credentials are selected; preserve an existing refresh token only when a successful reauthorization omits one.

## Approach

- Add small auth modules for PKCE, pending state, callback validation/listening, token exchange, credential persistence, and the CLI route.
- Keep auth-flow dependencies injectable enough for deterministic filesystem, HTTP, and command tests.
- Document normal and agent handoff usage in the README.

## Tasks

- [x] 1. Add OAuth authorization primitives, optional-client-secret support, secure pending state, and credential persistence.
- [x] 2. Add callback completion and loopback listener behavior with exact scope verification.
- [x] 3. Add the `auth login` CLI route, flags, structured output, and normal/agent modes.
- [x] 4. Add focused tests and user documentation, then run repository checks.

## Paths

- `src/cli/auth/`
- `src/cli/googleSearchConsoleCliRouteMap.ts`
- `src/cli/googleSearchConsoleCliFlags.ts`
- `src/cli/googleSearchConsoleCliOptions.ts`
- `src/shared/googleSearchConsoleOAuthConfigSchema.ts`
- `src/shared/googleSearchConsoleOAuthTokenResolve.ts`
- `test/cli/`
- `test/shared/`
- `README.md`
