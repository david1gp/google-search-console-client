import * as v from "valibot"
import { createResultError, type Result } from "#result"
import type { GoogleSearchConsoleClient } from "../../shared/GoogleSearchConsoleClient.js"
import { googleSearchConsolePathSegmentEncode } from "../../shared/googleSearchConsolePathSegmentEncode.js"
import { googleSearchConsoleRequest } from "../../shared/googleSearchConsoleRequest.js"
import { googleSearchConsoleSiteUrlSchema } from "../../shared/googleSearchConsoleSiteUrlSchema.js"
import { type SiteEntry, siteEntrySchema } from "../schemas/siteEntrySchema.js"

export async function siteGet(client: GoogleSearchConsoleClient, siteUrl: string): Promise<Result<SiteEntry>> {
  const op = "siteGet"
  const parsedSiteUrl = v.safeParse(googleSearchConsoleSiteUrlSchema, siteUrl)
  if (!parsedSiteUrl.success) return createResultError(op, v.summarize(parsedSiteUrl.issues), siteUrl)

  const encodedSiteUrl = googleSearchConsolePathSegmentEncode(parsedSiteUrl.output)
  return googleSearchConsoleRequest(client, {
    op,
    path: `/sites/${encodedSiteUrl}`,
    method: "GET",
    schema: siteEntrySchema,
  })
}
