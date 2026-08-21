# @adaptive-ds/google-search-console-client

Validated TypeScript client and JSON CLI for the **Google Search Console API**. Library operations return `Result<T>` and validate inputs and responses with Valibot.

## Installation

```bash
bun add @adaptive-ds/google-search-console-client @adaptive-ds/result valibot
```

```bash
npm install @adaptive-ds/google-search-console-client @adaptive-ds/result valibot
```

The package also installs the `google-search-console` executable and its CLI runtime dependency.

## Authentication

The library accepts separate credentials for Google's OAuth and API-key authentication. OAuth can use either a static bearer token or a refresh-token configuration:

- `accessToken`: OAuth 2.0 bearer token for Sites, Sitemaps, Search Analytics, URL Inspection, and Mobile-Friendly Testing.
- `oauth`: refresh-token configuration with `clientId`, `refreshToken`, optional `clientSecret`, and optional `tokenUrl`.
- `mobileFriendlyApiKey`: API key for Mobile-Friendly Testing. If both Mobile-Friendly credentials are configured, the API key is selected.

```typescript
import {
  googleSearchConsoleClientCreate,
  searchAnalyticsQuery,
} from "@adaptive-ds/google-search-console-client"

const clientResult = googleSearchConsoleClientCreate({
  accessToken: process.env.GOOGLE_SEARCH_CONSOLE_ACCESS_TOKEN,
})

if (!clientResult.success) {
  console.error(clientResult.errorMessage)
  process.exit(1)
}

const result = await searchAnalyticsQuery(clientResult.data, {
  siteUrl: "https://example.com/",
  startDate: "2026-08-01",
  endDate: "2026-08-15",
  dimensions: ["query", "page"],
  rowLimit: 10,
})

if (!result.success) {
  console.error(`Error (${result.op}): ${result.errorMessage}`)
  process.exit(1)
}

console.log(result.data.rows)
```

For a non-interactive refresh-token client, configure OAuth instead of `accessToken`:

```typescript
import { googleSearchConsoleClientCreate } from "@adaptive-ds/google-search-console-client"

const requiredEnvironmentVariable = (name: string): string => {
  const value = process.env[name]
  if (!value) throw new Error(`Missing required environment variable: ${name}`)
  return value
}

const clientResult = googleSearchConsoleClientCreate({
  oauth: {
    clientId: requiredEnvironmentVariable("GOOGLE_SEARCH_CONSOLE_OAUTH_CLIENT_ID"),
    clientSecret: requiredEnvironmentVariable("GOOGLE_SEARCH_CONSOLE_OAUTH_CLIENT_SECRET"),
    refreshToken: requiredEnvironmentVariable("GOOGLE_SEARCH_CONSOLE_OAUTH_REFRESH_TOKEN"),
    // Optional; defaults to https://oauth2.googleapis.com/token.
    tokenUrl: process.env.GOOGLE_SEARCH_CONSOLE_OAUTH_TOKEN_URL,
  },
})
```

`GoogleSearchConsoleOAuthConfig`, `GoogleSearchConsoleOAuthConfigInput`, and `googleSearchConsoleOAuthConfigSchema` are exported from the package. `clientId` and `refreshToken` are required; `clientSecret` and `tokenUrl` are optional. The library does not run an interactive authorization flow, request consent, or persist tokens. The refresh token must already have been obtained for the Google account and API scopes needed by the application.

When `oauth` is used, the client exchanges the refresh token for a bearer token automatically. The resulting access token is cached only in memory on that client, with a 60-second expiry margin; concurrent requests share one refresh. If an OAuth-backed request receives `401`, the cached token is invalidated, refreshed, and the request is retried once. Static `accessToken` takes precedence over `oauth` and therefore is not refreshed or retried by this mechanism. Mobile-Friendly API-key authentication remains separate.

## CLI

After installation, credentials can be supplied by flags, environment variables, or a dotenv-style file:

```bash
export GOOGLE_SEARCH_CONSOLE_ACCESS_TOKEN="oauth-token"
google-search-console sites list
google-search-console search-analytics query https://example.com/ 2026-08-01 2026-08-15 --dimensions query,page
```

Credential and configuration options:

- `--access-token`, `GOOGLE_SEARCH_CONSOLE_ACCESS_TOKEN`, or `GOOGLE_ACCESS_TOKEN`
- `--mobile-friendly-api-key` (or compatibility alias `--api-key`), `GOOGLE_SEARCH_CONSOLE_MOBILE_FRIENDLY_API_KEY`, `GOOGLE_SEARCH_CONSOLE_API_KEY`, or `GOOGLE_API_KEY`
- `--env-file <path>` to load either credential from a dotenv-style file
- `--base-url <url>` / `GOOGLE_SEARCH_CONSOLE_BASE_URL` and `--url-inspection-base-url <url>` / `GOOGLE_SEARCH_CONSOLE_URL_INSPECTION_BASE_URL` for endpoint testing
- `GOOGLE_SEARCH_CONSOLE_OAUTH_CLIENT_ID`, `GOOGLE_SEARCH_CONSOLE_OAUTH_CLIENT_SECRET`, `GOOGLE_SEARCH_CONSOLE_OAUTH_REFRESH_TOKEN`, and optional `GOOGLE_SEARCH_CONSOLE_OAUTH_TOKEN_URL` for refresh-token OAuth

OAuth variables can be supplied directly in the process environment or with `--env-file <path>`. The dotenv parser accepts `KEY=value`, optional `export`, single- or double-quoted values, comments, and blank lines. For OAuth fields, precedence is direct environment, then `--env-file`, then nested `oauth` JSON values, then flat Google authorized-user JSON values. A direct environment value always wins over a dotenv value.

### Authorize with `auth login`

`google-search-console auth login` runs an OAuth authorization-code flow with PKCE and requests exactly the `https://www.googleapis.com/auth/webmasters` scope. It saves the resulting refresh credentials to the selected credential profile. Without `--profile`, it uses the implicit `default` profile. A desktop OAuth client ID is required; pass it with `--client-id`, `GOOGLE_SEARCH_CONSOLE_OAUTH_CLIENT_ID`, an env file, or an existing credentials file. A desktop client secret is optional because desktop clients may be public; if supplied, use `--client-secret`, `GOOGLE_SEARCH_CONSOLE_OAUTH_CLIENT_SECRET`, an env file, or an existing credentials file. PKCE is used with or without a secret.

In normal mode, the command starts a loopback listener on `127.0.0.1`, opens Google's authorization page with the platform browser launcher, and waits for the callback. It does not read stdin:

```bash
export GOOGLE_SEARCH_CONSOLE_OAUTH_CLIENT_ID="your-desktop-client-id"
google-search-console auth login
```

On success, JSON is written to stdout:

```json
{"success":true,"data":{"credentialsFile":"/home/me/.config/google-search-console/credentials.json","status":"authorized"}}
```

Use `--agent` when the CLI cannot open a browser or the browser runs on another machine. It prints a pending JSON handoff and exits without opening a browser:

```bash
google-search-console auth login --agent --client-id "$GOOGLE_SEARCH_CONSOLE_OAUTH_CLIENT_ID"
```

The `data` object contains `authorizationUrl`, `callbackUrl`, `credentialsFile`, `completionCommand`, `instructions`, `pendingStateFile`, `profile`, and `status: "pending"`. Open `authorizationUrl` in a browser. Because agent mode does not run the loopback listener, the browser will show a failed loopback redirect after authorization. Copy the complete redirect URL from the address bar, replace the placeholder in `completionCommand`, and run it on the machine that created the pending state:

```bash
google-search-console auth login --callback-url 'PASTE_COMPLETE_LOOPBACK_REDIRECT_URL' --credentials-file '/home/me/.config/google-search-console/credentials.json' --profile 'default'
```

The callback URL contains the authorization code and state; treat it as sensitive and do not publish it. A successful completion prints the same `status: "authorized"` JSON as normal mode. The authorization grant must resolve to the exact Webmasters scope; credentials are not saved when the callback reports a different scope or the token response omits or differs from it.

### Credential profiles and storage

The CLI uses one profile for each normal command. Omit `--profile` to use `default`, or select a named profile with `--profile <name>`:

```bash
google-search-console auth login --profile work
google-search-console sites list --profile work
```

Profile names are 1–64 characters, start with a letter or number, and may contain only letters, numbers, `.`, `_`, and `-`. They cannot contain path separators or other path-like values.

The exact profile storage paths are:

- `default` credentials: `$HOME/.config/google-search-console/credentials.json`
- named credentials: `$HOME/.config/google-search-console/profiles/<name>/credentials.json`
- `default` pending OAuth state: `$HOME/.config/google-search-console/.oauth-pending.json`
- named pending OAuth state: `$HOME/.config/google-search-console/profiles/<name>/.oauth-pending.json`

On Windows, `$HOME` means `%USERPROFILE%` when `HOME` is not set. OAuth credential and pending-state files are written with mode `600`, and their containing directories with mode `700` where supported.

The existing `credentials.json` behavior remains compatible. For `auth login`, `--credentials-file <path>` takes precedence over `GOOGLE_SEARCH_CONSOLE_CREDENTIALS_FILE`, which takes precedence over the profile-derived path. The explicit path is also used by the generated callback completion command. Set `GOOGLE_SEARCH_CONSOLE_CREDENTIALS_FILE` as a direct environment variable to use a different JSON file for other CLI commands as well; `--env-file` does not select the credentials-file path. A missing implicit `default` file is allowed when credentials are supplied by flags or environment variables; regular commands require a readable valid credentials file for a selected named profile, while `auth login` can create a missing profile file. The file may contain these keys:

```json
{
  "accessToken": "oauth-token",
  "mobileFriendlyApiKey": "api-key",
  "baseUrl": "https://searchconsole.googleapis.com",
  "urlInspectionBaseUrl": "https://searchconsole.googleapis.com"
}
```

For refresh-token OAuth, the credentials file supports either nested camelCase fields:

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

or Google's authorized-user field names at the file root:

```json
{
  "client_id": "<client-id>",
  "client_secret": "<client-secret>",
  "refresh_token": "<refresh-token>",
  "token_uri": "https://oauth2.googleapis.com/token"
}
```

`tokenUrl`/`token_uri` is optional and defaults to `https://oauth2.googleapis.com/token`. A complete OAuth configuration requires `clientId`/`client_id` and `refreshToken`/`refresh_token`; `clientSecret`/`client_secret` is optional for public desktop clients. The file may also contain `accessToken`, `mobileFriendlyApiKey`, `baseUrl`, and `urlInspectionBaseUrl`. Overall CLI precedence is explicit flags, direct environment variables, `--env-file` values, credentials JSON values, then schema defaults where applicable; static `accessToken` still wins over refresh OAuth at request time. For regular commands, a default file may be absent when another credential source is present, but an explicitly selected file or named profile must be readable and contain valid JSON. `auth login` may create its selected target file.

Only `sites list` supports explicit aggregation across profiles:

```bash
google-search-console sites list --all-profiles
```

This discovers `default` (when its credentials file exists) and named profile directories, queries them in default-first then alphabetical order, and adds `profile` to every returned `siteEntry` while retaining each API response's `siteUrl` and `permissionLevel`. For example, successful JSON is emitted on one line in this shape:

```json
{"success":true,"data":{"siteEntry":[{"siteUrl":"sc-domain:example.com","permissionLevel":"siteOwner","profile":"default"},{"siteUrl":"https://example.net/","permissionLevel":"siteFullUser","profile":"work"}]}}
```

`--all-profiles` cannot be combined with `--profile` or `GOOGLE_SEARCH_CONSOLE_CREDENTIALS_FILE`. It fails if no profiles are configured or if any profile cannot be loaded or queried. Without `--all-profiles`, `sites list` keeps its existing response shape and uses exactly one profile; for example, `google-search-console sites list --profile work` still emits `{"success":true,"data":{"siteEntry":[{"siteUrl":"https://example.net/","permissionLevel":"siteFullUser"}]}}` without adding a `profile` property.

### Create authorized-user JSON safely

A Google installed-app client-secrets download is not itself a credentials file accepted by this package: its values are normally under an `installed` object. To combine it with an existing refresh token without placing secrets in shell history or output, keep the source files private and run a local script that reads them:

1. Save the downloaded client-secrets JSON and a one-line refresh-token file in a protected location. Do not commit either file.
2. Use `umask 077`, make the configuration directory private (`chmod 700`), and make each secret file private (`chmod 600`).
3. Extract `installed.client_id`, `installed.client_secret`, and, when present, `installed.token_uri`; combine them with the refresh token into the flat authorized-user shape above. The following writes no secret values to stdout:

```bash
umask 077
python3 - <<'PY'
import json
import os
from pathlib import Path

client_secrets_path = Path("/secure/path/client-secret.json")
refresh_token_path = Path("/secure/path/refresh-token.txt")
output_path = Path.home() / ".config/google-search-console/credentials.json"

installed = json.loads(client_secrets_path.read_text())["installed"]
refresh_token = refresh_token_path.read_text().strip()
credentials = {
    "client_id": installed["client_id"],
    "client_secret": installed["client_secret"],
    "refresh_token": refresh_token,
}
if installed.get("token_uri") is not None:
    credentials["token_uri"] = installed["token_uri"]

output_path.parent.mkdir(mode=0o700, parents=True, exist_ok=True)
os.chmod(output_path.parent, 0o700)
file_descriptor = os.open(output_path, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
with os.fdopen(file_descriptor, "w") as output_file:
    json.dump(credentials, output_file, indent=2)
    output_file.write("\n")
os.chmod(output_path, 0o600)
PY
```

Replace only the path placeholders; never paste credential values into the script. Verify the resulting file has mode `600`, then remove temporary copies when no longer needed. The default file is suitable for the CLI; the library itself receives the `oauth` object directly and does not read this file.

`--env-file` is separate from the credentials JSON file: it parses dotenv-style `KEY=value` entries for environment-variable configuration and does not select or replace the JSON file. `GOOGLE_SEARCH_CONSOLE_CREDENTIALS_FILE` must be set as a direct environment variable to override the JSON file location.

Commands:

```text
google-search-console sites list
google-search-console sites get <site-url>
google-search-console sites add <site-url>
google-search-console sites delete <site-url>
google-search-console sitemaps list <site-url> [sitemap-index]
google-search-console sitemaps get <site-url> <sitemap-url>
google-search-console sitemaps submit <site-url> <sitemap-url>
google-search-console sitemaps delete <site-url> <sitemap-url>
google-search-console search-analytics query <site-url> <start-date> <end-date>
google-search-console url-inspection inspect <inspection-url> <site-url>
google-search-console mobile-friendly-test run <url>
google-search-console auth login [--agent] [--callback-url url] [--client-id client-id] [--client-secret client-secret] [--credentials-file path] [--env-file path] [--profile name]
google-search-console sites list --all-profiles
```

Use `--help` on the executable or command for all optional flags. Successful results are JSON on stdout; `ResultErr` values are JSON on stderr and exit with status `1`.

## API routes

All routes use `https://searchconsole.googleapis.com` by default. Site and sitemap URLs are encoded by the client.

| Library operation | Method and route | Auth |
| --- | --- | --- |
| `sitesList`, `siteGet`, `siteAdd`, `siteDelete` | `GET /webmasters/v3/sites`, `GET/PUT/DELETE /webmasters/v3/sites/{siteUrl}` | OAuth |
| `sitemapsList` | `GET /webmasters/v3/sites/{siteUrl}/sitemaps` (`sitemapIndex` is optional) | OAuth |
| `sitemapGet`, `sitemapSubmit`, `sitemapDelete` | `GET/PUT/DELETE /webmasters/v3/sites/{siteUrl}/sitemaps/{feedpath}` | OAuth |
| `searchAnalyticsQuery` | `POST /webmasters/v3/sites/{siteUrl}/searchAnalytics/query` | OAuth |
| `urlInspectionIndexInspect` | `POST /v1/urlInspection/index:inspect` | OAuth |
| `mobileFriendlyTestRun` | `POST /v1/urlTestingTools/mobileFriendlyTest:run` (or `?key={apiKey}`) | OAuth or API key |

The root module exports the client, endpoint functions, schemas, and derived types. Endpoint-specific modules are also available under `sites/`, `sitemaps/`, `searchAnalytics/`, `urlInspection/`, and `mobileFriendlyTest/`.

## Official references

- [Sites REST reference](https://developers.google.com/webmaster-tools/v1/sites)
- [Search Analytics query REST reference](https://developers.google.com/webmaster-tools/v1/searchanalytics/query)
- [Search Console v1 discovery schema](https://searchconsole.googleapis.com/$discovery/rest?version=v1)

## Sites and Search Analytics schemas

Sites and Search Analytics schemas and types are exported from the package root and their endpoint modules. Validate a request with the exported schema and keep wire enum values lower/camel-case:

```typescript
import * as v from "valibot"
import {
  searchAnalyticsQueryRequestSchema,
  type SearchAnalyticsQueryRequestInput,
  type SearchAnalyticsQueryRequest,
} from "@adaptive-ds/google-search-console-client/searchAnalytics"

const request: SearchAnalyticsQueryRequestInput = {
  siteUrl: "https://example.com/",
  startDate: "2026-08-01",
  endDate: "2026-08-15",
  dimensions: ["query", "page"],
  type: "web",
  aggregationType: "byPage",
  dataState: "final",
}

const validation = v.safeParse(searchAnalyticsQueryRequestSchema, request)
if (validation.success) {
  const parsedRequest: SearchAnalyticsQueryRequest = validation.output
  void parsedRequest
}
// `searchType` is deprecated but remains accepted as an input alias:
const compatibilityRequest: SearchAnalyticsQueryRequestInput = {
  siteUrl: "https://example.com/",
  startDate: "2026-08-01",
  endDate: "2026-08-15",
  searchType: "web",
}
const compatibilityValidation = v.safeParse(searchAnalyticsQueryRequestSchema, compatibilityRequest)
// Parsed/output JSON contains only `type: "web"`; conflicting `type` and `searchType` values are rejected locally.
// If neither is supplied, `type` is omitted and Google defaults to web.
```

`SearchAnalyticsQueryRequest` describes the parsed canonical request shape. `SearchAnalyticsQueryRequestInput` describes the
input accepted by `searchAnalyticsQuery`, including the deprecated `searchType` compatibility alias, which is normalized
before sending the request.

The Sites response contains `siteEntry` values with the property URL and permission level. Google may omit `siteEntry` for an empty collection:

```typescript
import * as v from "valibot"
import {
  sitesListResponseSchema,
  type SitesListResponse,
} from "@adaptive-ds/google-search-console-client/sites"

const response: SitesListResponse = {
  siteEntry: [{ siteUrl: "sc-domain:example.com", permissionLevel: "siteOwner" }],
}
const validated = v.safeParse(sitesListResponseSchema, response)
const emptyResponse: SitesListResponse = {}
```

Search Analytics rows always contain clicks, impressions, and CTR. `keys` is optional: it is omitted for a dimensionless query, and otherwise follows the requested dimension order. `position` is optional because Discover and Google News reports may omit it. Response metadata uses camelCase fields:

```typescript
import type { SearchAnalyticsQueryResponse } from "@adaptive-ds/google-search-console-client/searchAnalytics"

const analyticsResponse: SearchAnalyticsQueryResponse = {
  rows: [
    { keys: ["shoes", "US"], clicks: 12, impressions: 240, ctr: 0.05, position: 3.2 },
  ],
  responseAggregationType: "byPage",
  metadata: {
    firstIncompleteDate: "2026-08-14",
    firstIncompleteHour: "2026-08-14T12:00:00Z",
  },
}

// Request dimensions: ["query", "country"] -> keys: ["shoes", "US"]
const dimensionlessResponse: SearchAnalyticsQueryResponse = {
  rows: [{ clicks: 12, impressions: 240, ctr: 0.05 }],
}
const discoverOrGoogleNewsResponse: SearchAnalyticsQueryResponse = {
  rows: [{ keys: ["shoes"], clicks: 12, impressions: 240, ctr: 0.05 }],
}
const noDataResponse: SearchAnalyticsQueryResponse = {}
```

## Development

- `bun run format` - Format source and tests with Biome
- `bun run check` - Type-check source and tests
- `bun run test` - Build and run tests
- `bun run build` - Compile declarations and ESM output to `dist/`
- `bun run release` - Generate a changelog and GitHub release

## License

[MIT](./LICENSE) © [David Siewert](https://github.com/david1gp)
