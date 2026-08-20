import * as v from "valibot"
import { createResultError, type ResultErr, resultTryParsingFetchErr } from "#result"
import { googleSearchConsoleAccessTokenRedact } from "./googleSearchConsoleAccessTokenRedact.js"
import { googleSearchConsoleApiErrorResponseSchema } from "./googleSearchConsoleApiErrorResponseSchema.js"

export function googleApiErrorResultCreate(
  op: string,
  body: string,
  statusCode: number,
  statusText: string,
  redactionSecrets: Iterable<string> = [],
): ResultErr {
  const redactedBody = googleSearchConsoleAccessTokenRedact(redactionSecrets, body)
  const redactedStatusText = googleSearchConsoleAccessTokenRedact(redactionSecrets, statusText)
  const parsed = v.safeParse(v.pipe(v.string(), v.parseJson(), googleSearchConsoleApiErrorResponseSchema), redactedBody)
  if (!parsed.success) {
    const fallback = resultTryParsingFetchErr(
      op,
      redactedBody,
      statusCode,
      redactedStatusText || "Google API request failed",
    )
    return { ...fallback, op }
  }

  const googleError = parsed.output.error
  const result = createResultError(op, googleError.message, redactedBody)
  result.statusCode = statusCode
  if (googleError.status !== undefined) result.code = googleError.status
  return result
}
