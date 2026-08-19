import { createResult, type Result } from "#result"
import * as v from "valibot"
import type { GoogleSearchConsoleClient } from "./googleSearchConsoleClientCreate.js"
import { googleSearchConsoleRequest } from "./googleSearchConsoleRequest.js"

export async function sitemapSubmit(
  client: GoogleSearchConsoleClient,
  siteUrl: string,
  feedpath: string,
): Promise<Result<void>> {
  const op = "sitemapSubmit"
  const encodedSiteUrl = encodeURIComponent(siteUrl)
  const encodedFeedpath = encodeURIComponent(feedpath)
  const result = await googleSearchConsoleRequest(client, {
    op,
    path: `/sites/${encodedSiteUrl}/sitemaps/${encodedFeedpath}`,
    method: "PUT",
    schema: v.unknown(),
  })
  if (!result.success) {
    return result
  }
  return createResult(undefined)
}
