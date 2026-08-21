import * as v from "valibot"
import { createResult, createResultError, type Result } from "#result"
import type { GoogleSearchConsoleClient } from "./GoogleSearchConsoleClient.js"
import { googleApiErrorResultCreate } from "./googleApiErrorResultCreate.js"
import { googleSearchConsoleAccessTokenRedact } from "./googleSearchConsoleAccessTokenRedact.js"
import { googleSearchConsoleOAuthTokenResolve } from "./googleSearchConsoleOAuthTokenResolve.js"
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
  const oauthBacked = auth === "oauth" && client.config.accessToken === undefined && client.config.oauth !== undefined

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

  let accessToken: string | undefined
  const redactionSecrets = new Set<string>()
  if (client.config.oauth !== undefined) {
    if (client.config.oauth.clientSecret !== undefined) redactionSecrets.add(client.config.oauth.clientSecret)
    redactionSecrets.add(client.config.oauth.refreshToken)
  }
  if (auth === "oauth") {
    accessToken = client.config.accessToken
    if (accessToken === undefined) {
      const tokenResult = await googleSearchConsoleOAuthTokenResolve(client)
      if (!tokenResult.success) return { ...tokenResult, op }
      accessToken = tokenResult.data
    }
    redactionSecrets.add(accessToken)
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
        googleSearchConsoleAccessTokenRedact(redactionSecrets, error instanceof Error ? error.message : String(error)),
      )
    }
  }

  let hasRetried = false
  while (true) {
    let response: Response
    try {
      response = await client.fetch(url, init)
    } catch (error) {
      const errorData = error instanceof Error ? error.message : String(error)
      return createResultError(op, "Fetch failed", googleSearchConsoleAccessTokenRedact(redactionSecrets, errorData))
    }

    let text: string
    try {
      text = await response.text()
    } catch (error) {
      const errorData = error instanceof Error ? error.message : String(error)
      return createResultError(
        op,
        "Reading response failed",
        googleSearchConsoleAccessTokenRedact(redactionSecrets, errorData),
      )
    }

    if (response.status === 401 && oauthBacked && !hasRetried) {
      hasRetried = true
      googleSearchConsoleOAuthTokenInvalidate(client, accessToken)
      const tokenResult = await googleSearchConsoleOAuthTokenResolve(client)
      if (!tokenResult.success) return { ...tokenResult, op }
      accessToken = tokenResult.data
      redactionSecrets.add(accessToken)
      headers.set("Authorization", `Bearer ${accessToken}`)
      continue
    }

    if (!response.ok)
      return googleApiErrorResultCreate(op, text, response.status, response.statusText, redactionSecrets)

    const parsed =
      text.length === 0 ? v.safeParse(schema, undefined) : v.safeParse(v.pipe(v.string(), v.parseJson(), schema), text)
    if (!parsed.success)
      return createResultError(
        op,
        v.summarize(parsed.issues),
        googleSearchConsoleAccessTokenRedact(redactionSecrets, text),
      )

    return createResult(parsed.output)
  }
}

function googleSearchConsoleOAuthTokenInvalidate(
  client: GoogleSearchConsoleClient,
  accessToken: string | undefined,
): void {
  const cache = client.oauthTokenCache
  if (cache === undefined || cache.accessToken !== accessToken) return
  cache.accessToken = undefined
  cache.expiresAt = undefined
}
