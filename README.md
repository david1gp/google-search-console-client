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

The library accepts separate credentials for Google's OAuth and API-key authentication:

- `accessToken`: OAuth 2.0 bearer token for Sites, Sitemaps, Search Analytics, URL Inspection, and Mobile-Friendly Testing.
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
  dimensions: ["QUERY", "PAGE"],
  rowLimit: 10,
})

if (!result.success) {
  console.error(`Error (${result.op}): ${result.errorMessage}`)
  process.exit(1)
}

console.log(result.data.rows)
```

## CLI

After installation, credentials can be supplied by flags, environment variables, or a dotenv-style file:

```bash
export GOOGLE_SEARCH_CONSOLE_ACCESS_TOKEN="oauth-token"
google-search-console sites list
google-search-console search-analytics query https://example.com/ 2026-08-01 2026-08-15 --dimensions QUERY,PAGE
```

Credential and configuration options:

- `--access-token`, `GOOGLE_SEARCH_CONSOLE_ACCESS_TOKEN`, or `GOOGLE_ACCESS_TOKEN`
- `--mobile-friendly-api-key` (or compatibility alias `--api-key`), `GOOGLE_SEARCH_CONSOLE_MOBILE_FRIENDLY_API_KEY`, `GOOGLE_SEARCH_CONSOLE_API_KEY`, or `GOOGLE_API_KEY`
- `--env-file <path>` to load either credential from a dotenv-style file
- `--base-url <url>` / `GOOGLE_SEARCH_CONSOLE_BASE_URL` and `--url-inspection-base-url <url>` / `GOOGLE_SEARCH_CONSOLE_URL_INSPECTION_BASE_URL` for endpoint testing

The CLI also loads credentials from `~/.config/google-search-console/credentials.json` by default. Set `GOOGLE_SEARCH_CONSOLE_CREDENTIALS_FILE` to use a different JSON file. The file may contain these keys:

```json
{
  "accessToken": "oauth-token",
  "mobileFriendlyApiKey": "api-key",
  "baseUrl": "https://searchconsole.googleapis.com",
  "urlInspectionBaseUrl": "https://searchconsole.googleapis.com"
}
```

`accessToken` or `mobileFriendlyApiKey` is required when the file exists. Configuration precedence is, from highest to lowest: explicit CLI flags, direct environment variables, values from `--env-file`, values from the credentials JSON file, and schema defaults where applicable. The default credentials file may be absent; an explicitly selected file must be readable and contain valid JSON with the shape above.

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

## Development

- `bun run format` - Format source and tests with Biome
- `bun run check` - Type-check source and tests
- `bun run test` - Build and run tests
- `bun run build` - Compile declarations and ESM output to `dist/`
- `bun run release` - Generate a changelog and GitHub release

## License

[MIT](./LICENSE) © [David Siewert](https://github.com/david1gp)
