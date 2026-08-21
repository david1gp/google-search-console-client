import * as v from "valibot"
import { createResult, createResultError, type Result } from "#result"
import type { GoogleSearchConsoleClient } from "./GoogleSearchConsoleClient.js"
import type { GoogleSearchConsoleOAuthConfig } from "./googleSearchConsoleOAuthConfigSchema.js"
import { googleSearchConsoleOAuthTokenResponseSchema } from "./googleSearchConsoleOAuthTokenResponseSchema.js"

const googleSearchConsoleOAuthTokenCacheSkewMs = 60_000

export function googleSearchConsoleOAuthTokenResolve(client: GoogleSearchConsoleClient): Promise<Result<string>> {
  const op = "googleSearchConsoleOAuthTokenResolve"
  const oauth = client.config.oauth
  if (oauth === undefined) return Promise.resolve(createResultError(op, "oauth is required"))

  let cache = client.oauthTokenCache
  if (cache === undefined) {
    cache = {}
    client.oauthTokenCache = cache
  }
  if (
    cache.accessToken !== undefined &&
    cache.expiresAt !== undefined &&
    Date.now() < cache.expiresAt - googleSearchConsoleOAuthTokenCacheSkewMs
  ) {
    return Promise.resolve(createResult(cache.accessToken))
  }

  if (cache.refreshPromise !== undefined) return cache.refreshPromise

  const refreshPromise = googleSearchConsoleOAuthTokenRefresh(client.fetch, oauth, cache, op).finally(() => {
    if (cache.refreshPromise === refreshPromise) cache.refreshPromise = undefined
  })
  cache.refreshPromise = refreshPromise
  return refreshPromise
}

async function googleSearchConsoleOAuthTokenRefresh(
  fetchFn: GoogleSearchConsoleClient["fetch"],
  oauth: GoogleSearchConsoleOAuthConfig,
  cache: NonNullable<GoogleSearchConsoleClient["oauthTokenCache"]>,
  op: string,
): Promise<Result<string>> {
  const body = new URLSearchParams({
    client_id: oauth.clientId,
    grant_type: "refresh_token",
    refresh_token: oauth.refreshToken,
  })
  if (oauth.clientSecret !== undefined) body.set("client_secret", oauth.clientSecret)

  let response: Response
  try {
    response = await fetchFn(oauth.tokenUrl, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    })
  } catch {
    return createResultError(op, "OAuth token request failed")
  }

  let text: string
  try {
    text = await response.text()
  } catch {
    return createResultError(op, "Reading OAuth token response failed")
  }

  if (!response.ok) {
    const result = createResultError(op, "OAuth token request failed")
    result.statusCode = response.status
    return result
  }

  const parsed = v.safeParse(v.pipe(v.string(), v.parseJson(), googleSearchConsoleOAuthTokenResponseSchema), text)
  if (!parsed.success) return createResultError(op, "Invalid OAuth token response")

  cache.accessToken = parsed.output.access_token
  cache.expiresAt = Date.now() + parsed.output.expires_in * 1000
  return createResult(parsed.output.access_token)
}
