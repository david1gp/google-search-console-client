import * as v from "valibot"
import { createResult, createResultError, type Result } from "#result"
import type { GoogleSearchConsoleClient } from "./GoogleSearchConsoleClient.js"
import { googleApiErrorResultCreate } from "./googleApiErrorResultCreate.js"
import { googleSearchConsoleUrlSchema } from "./googleSearchConsoleUrlSchema.js"

type GoogleSearchConsoleRequestOptions<TSchema extends v.GenericSchema> = {
  op: string
  path: string
  method?: string
  body?: unknown
  headers?: HeadersInit
  query?: Record<string, boolean | number | string | undefined>
  schema: TSchema
  baseUrl?: string
  auth?: "oauth" | "mobileFriendlyApiKey"
}

export async function googleSearchConsoleRequest<TSchema extends v.GenericSchema>(
  client: GoogleSearchConsoleClient,
  options: GoogleSearchConsoleRequestOptions<TSchema>,
): Promise<Result<v.InferOutput<TSchema>>> {
  const { op, path, method = "GET", body, schema } = options
  const auth = options.auth ?? "oauth"

  const baseUrl = options.baseUrl ?? client.config.baseUrl
  const parsedBaseUrl = v.safeParse(googleSearchConsoleUrlSchema, baseUrl)
  if (!parsedBaseUrl.success) return createResultError(op, v.summarize(parsedBaseUrl.issues))

  let url: URL
  try {
    url = new URL(`./${path.replace(/^\/+/, "")}`, `${parsedBaseUrl.output.replace(/\/+$/, "")}/`)
  } catch (error) {
    return createResultError(op, "Invalid request URL", error instanceof Error ? error.message : String(error))
  }
  for (const [key, value] of Object.entries(options.query ?? {})) {
    if (value !== undefined) url.searchParams.set(key, String(value))
  }

  let headers: Headers
  try {
    headers = new Headers(options.headers)
  } catch (error) {
    return createResultError(op, "Invalid request headers", error instanceof Error ? error.message : String(error))
  }
  headers.set("Accept", headers.get("Accept") ?? "application/json")

  if (auth === "oauth") {
    const accessToken = client.config.accessToken
    if (accessToken === undefined) return createResultError(op, "accessToken is required for OAuth requests")
    headers.set("Authorization", `Bearer ${accessToken}`)
  }

  if (auth === "mobileFriendlyApiKey") {
    const apiKey = client.config.mobileFriendlyApiKey
    if (apiKey === undefined) return createResultError(op, "mobileFriendlyApiKey is required for API-key requests")
    url.searchParams.set("key", apiKey)
    headers.delete("Authorization")
  }

  const init: RequestInit = {
    method,
    headers,
  }

  if (body !== undefined) {
    headers.set("Content-Type", headers.get("Content-Type") ?? "application/json")
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
    response = await client.fetch(url, init)
  } catch (error) {
    return createResultError(op, "Fetch failed", error instanceof Error ? error.message : String(error))
  }

  let text: string
  try {
    text = await response.text()
  } catch (error) {
    return createResultError(op, "Reading response failed", error instanceof Error ? error.message : String(error))
  }

  if (!response.ok) return googleApiErrorResultCreate(op, text, response.status, response.statusText)

  const parsed =
    text.length === 0 ? v.safeParse(schema, undefined) : v.safeParse(v.pipe(v.string(), v.parseJson(), schema), text)
  if (!parsed.success) return createResultError(op, v.summarize(parsed.issues), text)

  return createResult(parsed.output)
}
