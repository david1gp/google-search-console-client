import type { Result } from "#result"
import type { GoogleSearchConsoleClient } from "../../shared/GoogleSearchConsoleClient.js"
import { googleSearchConsoleRequest } from "../../shared/googleSearchConsoleRequest.js"
import { type SitesListResponse, sitesListResponseSchema } from "../schemas/sitesListResponseSchema.js"

export async function sitesList(client: GoogleSearchConsoleClient): Promise<Result<SitesListResponse>> {
  const op = "sitesList"
  return googleSearchConsoleRequest(client, {
    op,
    path: "/sites",
    method: "GET",
    schema: sitesListResponseSchema,
  })
}
