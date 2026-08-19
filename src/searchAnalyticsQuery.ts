import { createResultError, type Result } from "#result"
import * as v from "valibot"
import type { GoogleSearchConsoleClient } from "./googleSearchConsoleClientCreate.js"
import { googleSearchConsoleRequest } from "./googleSearchConsoleRequest.js"
import {
  type SearchAnalyticsQueryResponse,
  searchAnalyticsQueryRequestSchema,
  searchAnalyticsQueryResponseSchema,
} from "./searchAnalyticsSchemas.js"

export async function searchAnalyticsQuery(
  client: GoogleSearchConsoleClient,
  request: v.InferInput<typeof searchAnalyticsQueryRequestSchema>,
): Promise<Result<SearchAnalyticsQueryResponse>> {
  const op = "searchAnalyticsQuery"
  const parsedRequest = v.safeParse(searchAnalyticsQueryRequestSchema, request)
  if (!parsedRequest.success) {
    return createResultError(op, `Invalid search analytics query request: ${v.summarize(parsedRequest.issues)}`)
  }

  const { siteUrl, ...body } = parsedRequest.output
  const encodedSiteUrl = encodeURIComponent(siteUrl)

  return googleSearchConsoleRequest(client, {
    op,
    path: `/sites/${encodedSiteUrl}/searchAnalytics/query`,
    method: "POST",
    body,
    schema: searchAnalyticsQueryResponseSchema,
  })
}
