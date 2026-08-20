import * as v from "valibot"
import { createResult, createResultError, type Result } from "#result"
import type { GoogleSearchConsoleClient } from "../../shared/GoogleSearchConsoleClient.js"
import { googleSearchConsolePathSegmentEncode } from "../../shared/googleSearchConsolePathSegmentEncode.js"
import { googleSearchConsoleRequest } from "../../shared/googleSearchConsoleRequest.js"
import { googleSearchConsoleSiteUrlSchema } from "../../shared/googleSearchConsoleSiteUrlSchema.js"

export async function siteDelete(client: GoogleSearchConsoleClient, siteUrl: string): Promise<Result<void>> {
  const op = "siteDelete"
  const parsedSiteUrl = v.safeParse(googleSearchConsoleSiteUrlSchema, siteUrl)
  if (!parsedSiteUrl.success) return createResultError(op, v.summarize(parsedSiteUrl.issues), siteUrl)

  const encodedSiteUrl = googleSearchConsolePathSegmentEncode(parsedSiteUrl.output)
  const result = await googleSearchConsoleRequest(client, {
    op,
    path: `/sites/${encodedSiteUrl}`,
    method: "DELETE",
    schema: v.unknown(),
  })
  if (!result.success) return result
  return createResult(undefined)
}
