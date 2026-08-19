import type { Result } from "#result"
import type { GoogleSearchConsoleClient } from "./googleSearchConsoleClientCreate.js"
import { googleSearchConsoleRequest } from "./googleSearchConsoleRequest.js"
import { type SiteEntry, siteEntrySchema } from "./sitesListResponseSchema.js"

export async function siteGet(client: GoogleSearchConsoleClient, siteUrl: string): Promise<Result<SiteEntry>> {
  const op = "siteGet"
  const encodedSiteUrl = encodeURIComponent(siteUrl)
  return googleSearchConsoleRequest(client, {
    op,
    path: `/sites/${encodedSiteUrl}`,
    method: "GET",
    schema: siteEntrySchema,
  })
}
