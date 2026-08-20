import * as v from "valibot"
import { createResultError, type ResultErr, resultTryParsingFetchErr } from "#result"
import { googleSearchConsoleApiErrorResponseSchema } from "./googleSearchConsoleApiErrorResponseSchema.js"

export function googleApiErrorResultCreate(
  op: string,
  body: string,
  statusCode: number,
  statusText: string,
): ResultErr {
  const parsed = v.safeParse(v.pipe(v.string(), v.parseJson(), googleSearchConsoleApiErrorResponseSchema), body)
  if (!parsed.success) {
    const fallback = resultTryParsingFetchErr(op, body, statusCode, statusText || "Google API request failed")
    return { ...fallback, op }
  }

  const googleError = parsed.output.error
  const result = createResultError(op, googleError.message, body)
  result.statusCode = statusCode
  if (googleError.status !== undefined) result.code = googleError.status
  return result
}
