import { createResult, createResultError, type Result } from "#result"

export type GoogleSearchConsoleOAuthCallback = {
  readonly code?: string
  readonly error?: string
  readonly errorDescription?: string
  readonly scope?: string
  readonly state: string
}

export type GoogleSearchConsoleOAuthCallbackParseOptions = {
  readonly callbackUrl: string | URL
  readonly redirectUri: string
  readonly state: string
}

export function googleSearchConsoleOAuthCallbackParse(
  options: GoogleSearchConsoleOAuthCallbackParseOptions,
): Result<GoogleSearchConsoleOAuthCallback> {
  const op = "googleSearchConsoleOAuthCallbackParse"
  if (options.state.length === 0) return createResultError(op, "Invalid OAuth state")

  let callbackUrl: URL
  let redirectUrl: URL
  try {
    callbackUrl = new URL(options.callbackUrl)
    redirectUrl = new URL(options.redirectUri)
  } catch {
    return createResultError(op, "Invalid OAuth callback URL")
  }

  if (
    (redirectUrl.protocol !== "http:" && redirectUrl.protocol !== "https:") ||
    redirectUrl.username.length > 0 ||
    redirectUrl.password.length > 0 ||
    callbackUrl.username.length > 0 ||
    callbackUrl.password.length > 0
  ) {
    return createResultError(op, "Invalid OAuth callback URL")
  }

  if (
    callbackUrl.origin !== redirectUrl.origin ||
    callbackUrl.pathname !== redirectUrl.pathname ||
    callbackUrl.hash.length > 0
  ) {
    return createResultError(op, "OAuth callback URL does not match the pending redirect")
  }

  const callbackParameters = callbackUrl.searchParams
  for (const parameter of ["code", "error", "error_description", "error_uri", "scope", "state"]) {
    if (callbackParameters.getAll(parameter).length > 1) {
      return createResultError(op, "OAuth callback contains duplicate parameters")
    }
  }

  const state = googleSearchConsoleOAuthCallbackParameterRead(callbackParameters, "state")
  if (state === undefined || state !== options.state) return createResultError(op, "OAuth callback state mismatch")

  const scope = googleSearchConsoleOAuthCallbackParameterRead(callbackParameters, "scope")
  if (scope === null || (callbackParameters.has("scope") && scope === undefined))
    return createResultError(op, "OAuth callback granted scope is invalid")

  const code = googleSearchConsoleOAuthCallbackParameterRead(callbackParameters, "code")
  const error = googleSearchConsoleOAuthCallbackParameterRead(callbackParameters, "error")
  if (code === null || error === null) return createResultError(op, "OAuth callback contains duplicate parameters")
  if (code !== undefined && error !== undefined) return createResultError(op, "OAuth callback contains code and error")
  if (code === undefined && error === undefined) return createResultError(op, "OAuth callback is missing code or error")

  return createResult({
    code: code ?? undefined,
    error: error ?? undefined,
    errorDescription:
      googleSearchConsoleOAuthCallbackParameterRead(callbackParameters, "error_description") ?? undefined,
    scope: scope ?? undefined,
    state,
  })
}

function googleSearchConsoleOAuthCallbackParameterRead(
  parameters: URLSearchParams,
  name: string,
): string | null | undefined {
  const values = parameters.getAll(name)
  if (values.length > 1) return null
  const value = values[0]
  if (value === undefined || value.length === 0) return undefined
  return value
}
