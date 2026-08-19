import type { Result } from "#result"
import type { GoogleSearchConsoleClient } from "./googleSearchConsoleClientCreate.js"
import { googleSearchConsoleRequest } from "./googleSearchConsoleRequest.js"
import { type SitesListResponse, sitesListResponseSchema } from "./sitesListResponseSchema.js"

export async function sitesList(client: GoogleSearchConsoleClient): Promise<Result<SitesListResponse>> {
  const op = "sitesList"
  return googleSearchConsoleRequest(client, {
    op,
    path: "/sites",
    method: "GET",
    schema: sitesListResponseSchema,
  })
}
