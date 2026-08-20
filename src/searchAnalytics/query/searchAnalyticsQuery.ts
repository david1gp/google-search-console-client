import * as v from "valibot"
import { createResultError, type Result } from "#result"
import type { GoogleSearchConsoleClient } from "../../shared/GoogleSearchConsoleClient.js"
import { googleSearchConsolePathSegmentEncode } from "../../shared/googleSearchConsolePathSegmentEncode.js"
import { googleSearchConsoleRequest } from "../../shared/googleSearchConsoleRequest.js"
import {
  type SearchAnalyticsQueryRequestInput,
  type SearchAnalyticsQueryResponse,
  searchAnalyticsQueryRequestSchema,
  searchAnalyticsQueryResponseSchema,
} from "../schemas/index.js"

export async function searchAnalyticsQuery(
  client: GoogleSearchConsoleClient,
  request: SearchAnalyticsQueryRequestInput,
): Promise<Result<SearchAnalyticsQueryResponse>> {
  const op = "searchAnalyticsQuery"
  const parsedRequest = v.safeParse(searchAnalyticsQueryRequestSchema, request)
  if (!parsedRequest.success) {
    return createResultError(op, v.summarize(parsedRequest.issues))
  }

  const { siteUrl, ...body } = parsedRequest.output
  return googleSearchConsoleRequest(client, {
    op,
    path: `/sites/${googleSearchConsolePathSegmentEncode(siteUrl)}/searchAnalytics/query`,
    method: "POST",
    body,
    schema: searchAnalyticsQueryResponseSchema,
  })
}
