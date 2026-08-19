import { createResult, type Result } from "#result"
import * as v from "valibot"
import type { GoogleSearchConsoleClient } from "./googleSearchConsoleClientCreate.js"
import { googleSearchConsoleRequest } from "./googleSearchConsoleRequest.js"

export async function siteDelete(client: GoogleSearchConsoleClient, siteUrl: string): Promise<Result<void>> {
  const op = "siteDelete"
  const encodedSiteUrl = encodeURIComponent(siteUrl)
  const result = await googleSearchConsoleRequest(client, {
    op,
    path: `/sites/${encodedSiteUrl}`,
    method: "DELETE",
    schema: v.unknown(),
  })
  if (!result.success) {
    return result
  }
  return createResult(undefined)
}
