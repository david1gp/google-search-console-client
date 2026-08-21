import * as v from "valibot"
import { createResult, createResultError, type Result } from "#result"
import type { GoogleSearchConsoleFetch } from "../../shared/googleSearchConsoleFetch.js"
import { googleSearchConsoleOAuthTokenResponseSchema } from "../../shared/googleSearchConsoleOAuthTokenResponseSchema.js"

export type GoogleSearchConsoleOAuthAuthorizationCodeExchangeOptions = {
  readonly clientId: string
  readonly clientSecret?: string
  readonly code: string
  readonly codeVerifier: string
  readonly redirectUri: string
  readonly tokenUrl?: string
}

export async function googleSearchConsoleOAuthAuthorizationCodeExchange(
  fetchFn: GoogleSearchConsoleFetch,
  options: GoogleSearchConsoleOAuthAuthorizationCodeExchangeOptions,
): Promise<Result<v.InferOutput<typeof googleSearchConsoleOAuthTokenResponseSchema>>> {
  const op = "googleSearchConsoleOAuthAuthorizationCodeExchange"
  const body = new URLSearchParams({
    client_id: options.clientId,
    code: options.code,
    code_verifier: options.codeVerifier,
    grant_type: "authorization_code",
    redirect_uri: options.redirectUri,
  })
  if (options.clientSecret !== undefined) body.set("client_secret", options.clientSecret)

  let response: Response
  try {
    response = await fetchFn(options.tokenUrl ?? "https://oauth2.googleapis.com/token", {
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
  return createResult(parsed.output)
}
