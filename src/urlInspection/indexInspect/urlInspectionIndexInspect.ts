import * as v from "valibot"
import { createResultError, type Result } from "#result"
import type { GoogleSearchConsoleClient } from "../../shared/GoogleSearchConsoleClient.js"
import { googleSearchConsoleRequest } from "../../shared/googleSearchConsoleRequest.js"
import {
  type UrlInspectionIndexInspectResponse,
  urlInspectionIndexInspectRequestSchema,
  urlInspectionIndexInspectResponseSchema,
} from "../schemas/index.js"

export async function urlInspectionIndexInspect(
  client: GoogleSearchConsoleClient,
  request: v.InferInput<typeof urlInspectionIndexInspectRequestSchema>,
): Promise<Result<UrlInspectionIndexInspectResponse>> {
  const op = "urlInspectionIndexInspect"
  const parsedRequest = v.safeParse(urlInspectionIndexInspectRequestSchema, request)
  if (!parsedRequest.success) return createResultError(op, v.summarize(parsedRequest.issues))

  return googleSearchConsoleRequest(client, {
    op,
    baseUrl: client.config.urlInspectionBaseUrl,
    path: "/urlInspection/index:inspect",
    method: "POST",
    body: parsedRequest.output,
    schema: urlInspectionIndexInspectResponseSchema,
  })
}
