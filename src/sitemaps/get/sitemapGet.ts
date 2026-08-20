import * as v from "valibot"
import { createResultError, type Result } from "#result"
import type { GoogleSearchConsoleClient } from "../../shared/GoogleSearchConsoleClient.js"
import { googleSearchConsolePathSegmentEncode } from "../../shared/googleSearchConsolePathSegmentEncode.js"
import { googleSearchConsoleRequest } from "../../shared/googleSearchConsoleRequest.js"
import { googleSearchConsoleSiteUrlSchema } from "../../shared/googleSearchConsoleSiteUrlSchema.js"
import { googleSearchConsoleUrlSchema } from "../../shared/googleSearchConsoleUrlSchema.js"
import { type SitemapEntry, sitemapEntrySchema } from "../schemas/sitemapEntrySchema.js"

export async function sitemapGet(
  client: GoogleSearchConsoleClient,
  siteUrl: string,
  feedpath: string,
): Promise<Result<SitemapEntry>> {
  const op = "sitemapGet"
  const parsedSiteUrl = v.safeParse(googleSearchConsoleSiteUrlSchema, siteUrl)
  if (!parsedSiteUrl.success) return createResultError(op, v.summarize(parsedSiteUrl.issues), siteUrl)
  const parsedFeedpath = v.safeParse(googleSearchConsoleUrlSchema, feedpath)
  if (!parsedFeedpath.success) return createResultError(op, v.summarize(parsedFeedpath.issues), feedpath)

  return googleSearchConsoleRequest(client, {
    op,
    path: `/sites/${googleSearchConsolePathSegmentEncode(parsedSiteUrl.output)}/sitemaps/${googleSearchConsolePathSegmentEncode(parsedFeedpath.output)}`,
    method: "GET",
    schema: sitemapEntrySchema,
  })
}
