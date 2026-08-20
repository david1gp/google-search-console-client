import * as v from "valibot"
import { createResultError, type Result } from "#result"
import type { GoogleSearchConsoleClient } from "../../shared/GoogleSearchConsoleClient.js"
import { googleSearchConsolePathSegmentEncode } from "../../shared/googleSearchConsolePathSegmentEncode.js"
import { googleSearchConsoleRequest } from "../../shared/googleSearchConsoleRequest.js"
import { googleSearchConsoleSiteUrlSchema } from "../../shared/googleSearchConsoleSiteUrlSchema.js"
import { googleSearchConsoleUrlSchema } from "../../shared/googleSearchConsoleUrlSchema.js"
import { type SitemapsListResponse, sitemapsListResponseSchema } from "../schemas/sitemapsListResponseSchema.js"

export async function sitemapsList(
  client: GoogleSearchConsoleClient,
  siteUrl: string,
  sitemapIndex?: string,
): Promise<Result<SitemapsListResponse>> {
  const op = "sitemapsList"
  const parsedSiteUrl = v.safeParse(googleSearchConsoleSiteUrlSchema, siteUrl)
  if (!parsedSiteUrl.success) return createResultError(op, v.summarize(parsedSiteUrl.issues), siteUrl)

  if (sitemapIndex !== undefined) {
    const parsedSitemapIndex = v.safeParse(googleSearchConsoleUrlSchema, sitemapIndex)
    if (!parsedSitemapIndex.success) return createResultError(op, v.summarize(parsedSitemapIndex.issues), sitemapIndex)
  }

  return googleSearchConsoleRequest(client, {
    op,
    path: `/sites/${googleSearchConsolePathSegmentEncode(parsedSiteUrl.output)}/sitemaps`,
    method: "GET",
    query: { sitemapIndex },
    schema: sitemapsListResponseSchema,
  })
}
