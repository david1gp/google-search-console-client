import * as v from "valibot"
import { createResult, createResultError, type Result } from "#result"
import type { GoogleSearchConsoleClient } from "../../shared/GoogleSearchConsoleClient.js"
import { googleSearchConsolePathSegmentEncode } from "../../shared/googleSearchConsolePathSegmentEncode.js"
import { googleSearchConsoleRequest } from "../../shared/googleSearchConsoleRequest.js"
import { googleSearchConsoleSiteUrlSchema } from "../../shared/googleSearchConsoleSiteUrlSchema.js"
import { googleSearchConsoleUrlSchema } from "../../shared/googleSearchConsoleUrlSchema.js"

export async function sitemapDelete(
  client: GoogleSearchConsoleClient,
  siteUrl: string,
  feedpath: string,
): Promise<Result<void>> {
  const op = "sitemapDelete"
  const parsedSiteUrl = v.safeParse(googleSearchConsoleSiteUrlSchema, siteUrl)
  if (!parsedSiteUrl.success) return createResultError(op, v.summarize(parsedSiteUrl.issues), siteUrl)
  const parsedFeedpath = v.safeParse(googleSearchConsoleUrlSchema, feedpath)
  if (!parsedFeedpath.success) return createResultError(op, v.summarize(parsedFeedpath.issues), feedpath)

  const result = await googleSearchConsoleRequest(client, {
    op,
    path: `/sites/${googleSearchConsolePathSegmentEncode(parsedSiteUrl.output)}/sitemaps/${googleSearchConsolePathSegmentEncode(parsedFeedpath.output)}`,
    method: "DELETE",
    schema: v.unknown(),
  })
  if (!result.success) return result
  return createResult(undefined)
}
