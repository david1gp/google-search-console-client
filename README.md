# @adaptive-ds/google-search-console-client

TypeScript client for the **Google Search Console API**. Built with strict type safety, **`Result` pattern** error handling, and runtime **Valibot** validation.

## Features

- 🛡️ **Result Pattern**: Never throws runtime exceptions; functions return `Result<T>` (`ResultOk<T>` or `ResultErr`).
- 🔍 **Strict Runtime Validation**: Powered by Valibot schemas for robust type derivations and input/output validation.
- ⚡ **Lightweight & Modern**: Zero bloated dependencies, ESM-native, fast build and test runtime using Bun.
- 🎯 **Domain-driven**: Clear bounded contexts for sites, search analytics query, sitemaps, and URL inspection.

## Installation

```bash
bun add @adaptive-ds/google-search-console-client @adaptive-ds/result valibot
```

or via npm:

```bash
npm install @adaptive-ds/google-search-console-client @adaptive-ds/result valibot
```

## Quick Start

```typescript
import {
  googleSearchConsoleClientCreate,
  searchAnalyticsQuery,
} from "@adaptive-ds/google-search-console-client"

const client = googleSearchConsoleClientCreate({
  accessToken: process.env.GOOGLE_ACCESS_TOKEN!,
})

// Query search performance metrics
const result = await searchAnalyticsQuery(client, {
  siteUrl: "https://example.com/",
  startDate: "2026-08-01",
  endDate: "2026-08-15",
  dimensions: ["query", "page"],
  rowLimit: 10,
})

if (!result.success) {
  console.error(`Error (${result.op}):`, result.errorMessage)
  process.exit(1)
}

console.log("Search Analytics Rows:", result.data.rows)
```

## API Overview

### Sites

- `sitesList(client)` - List all verified sites
- `siteGet(client, siteUrl)` - Get details for a specific site
- `siteAdd(client, siteUrl)` - Add a new site property
- `siteDelete(client, siteUrl)` - Remove a site property

### Search Analytics

- `searchAnalyticsQuery(client, query)` - Query search traffic metrics (clicks, impressions, CTR, position)

### Sitemaps

- `sitemapsList(client, siteUrl)` - List submitted sitemaps for a site
- `sitemapGet(client, siteUrl, feedpath)` - Get status and details of a specific sitemap
- `sitemapSubmit(client, siteUrl, feedpath)` - Submit a sitemap
- `sitemapDelete(client, siteUrl, feedpath)` - Delete a sitemap

### URL Inspection

- `urlInspectionIndexInspect(client, inspectionRequest)` - Inspect URL indexation status

## Scripts

- `bun run dev` - Run tests in watch mode
- `bun run test` - Run unit tests
- `bun run build` - Type-check and compile to `./dist`
- `bun run format` - Format code with Biome
- `bun run release` - Automated changelog generation & GitHub release

## License

[MIT](./LICENSE) © [David Siewert](https://github.com/david1gp)
