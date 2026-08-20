import * as v from "valibot"
import { createResultError, type Result } from "#result"
import type { GoogleSearchConsoleClient } from "../../shared/GoogleSearchConsoleClient.js"
import { googleSearchConsoleRequest } from "../../shared/googleSearchConsoleRequest.js"
import {
  type MobileFriendlyTestRunResponse,
  mobileFriendlyTestRunRequestSchema,
  mobileFriendlyTestRunResponseSchema,
} from "../schemas/index.js"

export async function mobileFriendlyTestRun(
  client: GoogleSearchConsoleClient,
  request: v.InferInput<typeof mobileFriendlyTestRunRequestSchema>,
): Promise<Result<MobileFriendlyTestRunResponse>> {
  const op = "mobileFriendlyTestRun"
  const parsedRequest = v.safeParse(mobileFriendlyTestRunRequestSchema, request)
  if (!parsedRequest.success) return createResultError(op, v.summarize(parsedRequest.issues))

  return googleSearchConsoleRequest(client, {
    op,
    baseUrl: "https://searchconsole.googleapis.com/v1",
    path: "/urlTestingTools/mobileFriendlyTest:run",
    method: "POST",
    auth: client.config.mobileFriendlyApiKey === undefined ? "oauth" : "mobileFriendlyApiKey",
    body: parsedRequest.output,
    schema: mobileFriendlyTestRunResponseSchema,
  })
}
