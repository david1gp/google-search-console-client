import type { Result } from "#result"
import type { GoogleSearchConsoleClient } from "./googleSearchConsoleClientCreate.js"
import { googleSearchConsoleRequest } from "./googleSearchConsoleRequest.js"
import { type SitemapEntry, sitemapEntrySchema } from "./sitemapSchemas.js"

export async function sitemapGet(
  client: GoogleSearchConsoleClient,
  siteUrl: string,
  feedpath: string,
): Promise<Result<SitemapEntry>> {
  const op = "sitemapGet"
  const encodedSiteUrl = encodeURIComponent(siteUrl)
  const encodedFeedpath = encodeURIComponent(feedpath)
  return googleSearchConsoleRequest(client, {
    op,
    path: `/sites/${encodedSiteUrl}/sitemaps/${encodedFeedpath}`,
    method: "GET",
    schema: sitemapEntrySchema,
  })
}
