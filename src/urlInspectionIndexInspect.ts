import { createResultError, type Result } from "#result"
import * as v from "valibot"
import type { GoogleSearchConsoleClient } from "./googleSearchConsoleClientCreate.js"
import { googleSearchConsoleRequest } from "./googleSearchConsoleRequest.js"
import {
  type UrlInspectionIndexInspectResponse,
  urlInspectionIndexInspectRequestSchema,
  urlInspectionIndexInspectResponseSchema,
} from "./urlInspectionSchemas.js"

export async function urlInspectionIndexInspect(
  client: GoogleSearchConsoleClient,
  request: v.InferInput<typeof urlInspectionIndexInspectRequestSchema>,
): Promise<Result<UrlInspectionIndexInspectResponse>> {
  const op = "urlInspectionIndexInspect"
  const parsedRequest = v.safeParse(urlInspectionIndexInspectRequestSchema, request)
  if (!parsedRequest.success) {
    return createResultError(op, `Invalid URL inspection request: ${v.summarize(parsedRequest.issues)}`)
  }

  return googleSearchConsoleRequest(client, {
    op,
    baseUrl: client.config.urlInspectionBaseUrl,
    path: "/urlInspection/index:inspect",
    method: "POST",
    body: parsedRequest.output,
    schema: urlInspectionIndexInspectResponseSchema,
  })
}
