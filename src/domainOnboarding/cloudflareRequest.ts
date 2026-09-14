import * as v from "valibot"
import { createResult, createResultError, type Result, resultTryParsingFetchErr } from "#result"
import type { GoogleSearchConsoleFetch } from "../shared/googleSearchConsoleFetch.js"

type CloudflareRequestOptions<TSchema extends v.GenericSchema> = {
  apiToken: string
  fetch?: GoogleSearchConsoleFetch
  baseUrl: string
  op: string
  path: string
  method?: string
  body?: unknown
  query?: Record<string, boolean | number | string | undefined>
  schema: TSchema
}

type CloudflareResponse<T> = {
  success: boolean
  errors?: unknown[]
  messages?: unknown[]
  result?: T
}

export async function cloudflareRequest<TSchema extends v.GenericSchema>(
  options: CloudflareRequestOptions<TSchema>,
): Promise<Result<CloudflareResponse<v.InferOutput<TSchema>>>> {
  const { apiToken, baseUrl, op, path, method = "GET", body, schema } = options
  const fetchFn = options.fetch ?? globalThis.fetch
  if (apiToken.length === 0) return createResultError(op, "Cloudflare API token is required")
  if (typeof fetchFn !== "function") return createResultError(op, "fetch must be a function")

  let url: URL
  try {
    url = new URL(`./${path.replace(/^\/+/, "")}`, `${baseUrl.replace(/\/+$/, "")}/`)
  } catch (error) {
    return createResultError(
      op,
      "Invalid Cloudflare request URL",
      error instanceof Error ? error.message : String(error),
    )
  }
  for (const [key, value] of Object.entries(options.query ?? {})) {
    if (value !== undefined) url.searchParams.set(key, String(value))
  }

  const headers = new Headers({
    Accept: "application/json",
    Authorization: `Bearer ${apiToken}`,
  })
  const init: RequestInit = { method, headers }
  if (body !== undefined) {
    headers.set("Content-Type", "application/json")
    try {
      init.body = JSON.stringify(body)
    } catch (error) {
      return createResultError(
        op,
        "Request body serialization failed",
        error instanceof Error ? error.message : String(error),
      )
    }
  }

  let response: Response
  try {
    response = await fetchFn(url, init)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return createResultError(op, "Fetch failed", message.replaceAll(apiToken, "[REDACTED]"))
  }

  let text: string
  try {
    text = await response.text()
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return createResultError(op, "Reading response failed", message.replaceAll(apiToken, "[REDACTED]"))
  }
  const redactedText = text.replaceAll(apiToken, "[REDACTED]")
  if (!response.ok) {
    return resultTryParsingFetchErr(
      op,
      redactedText,
      response.status,
      response.statusText.replaceAll(apiToken, "[REDACTED]"),
    )
  }

  const parsed = v.safeParse(
    v.pipe(
      v.string(),
      v.parseJson(),
      v.object({
        success: v.boolean(),
        errors: v.optional(v.array(v.unknown())),
        messages: v.optional(v.array(v.unknown())),
        result: v.optional(schema),
      }),
    ),
    redactedText,
  )
  if (!parsed.success) return createResultError(op, v.summarize(parsed.issues), redactedText)
  if (parsed.output.success !== true) {
    const errors = parsed.output.errors ?? []
    return createResultError(
      op,
      errors.length > 0 ? JSON.stringify(errors) : "Cloudflare API request failed",
      redactedText,
    )
  }
  return createResult({
    success: true,
    errors: parsed.output.errors,
    messages: parsed.output.messages,
    result: parsed.output.result,
  })
}
