import { createResult, createResultError, type Result } from "#result"
import { googleSearchConsoleOAuthScope } from "../../shared/googleSearchConsoleOAuthScope.js"

export type GoogleSearchConsoleOAuthAuthorizationUrlCreateOptions = {
  readonly authorizationUrl?: string
  readonly clientId: string
  readonly codeChallenge: string
  readonly redirectUri: string
  readonly state: string
}

export function googleSearchConsoleOAuthAuthorizationUrlCreate(
  options: GoogleSearchConsoleOAuthAuthorizationUrlCreateOptions,
): Result<string> {
  const op = "googleSearchConsoleOAuthAuthorizationUrlCreate"

  try {
    const url = new URL(options.authorizationUrl ?? "https://accounts.google.com/o/oauth2/v2/auth")
    url.search = new URLSearchParams({
      access_type: "offline",
      client_id: options.clientId,
      code_challenge: options.codeChallenge,
      code_challenge_method: "S256",
      prompt: "consent",
      redirect_uri: options.redirectUri,
      response_type: "code",
      scope: googleSearchConsoleOAuthScope,
      state: options.state,
    }).toString()
    return createResult(url.toString())
  } catch {
    return createResultError(op, "Unable to create OAuth authorization URL")
  }
}
