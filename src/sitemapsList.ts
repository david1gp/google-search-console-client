import type { Result } from "#result"
import type { GoogleSearchConsoleClient } from "./googleSearchConsoleClientCreate.js"
import { googleSearchConsoleRequest } from "./googleSearchConsoleRequest.js"
import { type SitemapsListResponse, sitemapsListResponseSchema } from "./sitemapSchemas.js"

export async function sitemapsList(
  client: GoogleSearchConsoleClient,
  siteUrl: string,
): Promise<Result<SitemapsListResponse>> {
  const op = "sitemapsList"
  const encodedSiteUrl = encodeURIComponent(siteUrl)
  return googleSearchConsoleRequest(client, {
    op,
    path: `/sites/${encodedSiteUrl}/sitemaps`,
    method: "GET",
    schema: sitemapsListResponseSchema,
  })
}
