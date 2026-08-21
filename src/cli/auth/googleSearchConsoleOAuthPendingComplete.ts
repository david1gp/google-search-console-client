import { unlink } from "node:fs/promises"
import { createResult, createResultError, type Result } from "#result"
import type { GoogleSearchConsoleFetch } from "../../shared/googleSearchConsoleFetch.js"
import { googleSearchConsoleOAuthScope } from "../../shared/googleSearchConsoleOAuthScope.js"
import {
  type GoogleSearchConsoleOAuthAuthorizationCodeExchangeOptions,
  googleSearchConsoleOAuthAuthorizationCodeExchange,
} from "./googleSearchConsoleOAuthAuthorizationCodeExchange.js"
import { googleSearchConsoleOAuthCallbackParse } from "./googleSearchConsoleOAuthCallbackParse.js"
import { googleSearchConsoleOAuthCredentialsPersist } from "./googleSearchConsoleOAuthCredentialsPersist.js"
import { googleSearchConsoleOAuthPendingStateLoad } from "./googleSearchConsoleOAuthPendingStateLoad.js"

export type GoogleSearchConsoleOAuthPendingCompleteOptions = {
  readonly callbackUrl: string | URL
  readonly credentialsPath: string
  readonly pendingStatePath: string
}

export async function googleSearchConsoleOAuthPendingComplete(
  fetchFn: GoogleSearchConsoleFetch,
  options: GoogleSearchConsoleOAuthPendingCompleteOptions,
): Promise<Result<void>> {
  const op = "googleSearchConsoleOAuthPendingComplete"
  const pendingResult = await googleSearchConsoleOAuthPendingStateLoad(options.pendingStatePath)
  if (!pendingResult.success) return pendingResult

  const callbackResult = googleSearchConsoleOAuthCallbackParse({
    callbackUrl: options.callbackUrl,
    redirectUri: pendingResult.data.redirectUri,
    state: pendingResult.data.state,
  })
  if (!callbackResult.success) return callbackResult

  if (callbackResult.data.error !== undefined) {
    const cleanupResult = await googleSearchConsoleOAuthPendingCompleteCleanup(options.pendingStatePath, op)
    if (!cleanupResult.success) return cleanupResult
    return createResultError(op, "OAuth authorization was denied")
  }

  if (callbackResult.data.code === undefined)
    return createResultError(op, "OAuth callback is missing an authorization code")
  if (callbackResult.data.scope !== undefined && callbackResult.data.scope !== googleSearchConsoleOAuthScope) {
    const cleanupResult = await googleSearchConsoleOAuthPendingCompleteCleanup(options.pendingStatePath, op)
    if (!cleanupResult.success) return cleanupResult
    return createResultError(op, "OAuth grant did not include the required Search Console scope")
  }

  const exchangeOptions: GoogleSearchConsoleOAuthAuthorizationCodeExchangeOptions = {
    clientId: pendingResult.data.clientId,
    clientSecret: pendingResult.data.clientSecret,
    code: callbackResult.data.code,
    codeVerifier: pendingResult.data.codeVerifier,
    redirectUri: pendingResult.data.redirectUri,
    tokenUrl: pendingResult.data.tokenUrl,
  }
  const exchangeResult = await googleSearchConsoleOAuthAuthorizationCodeExchange(fetchFn, exchangeOptions)
  if (!exchangeResult.success) return exchangeResult
  if (exchangeResult.data.scope !== googleSearchConsoleOAuthScope) {
    const cleanupResult = await googleSearchConsoleOAuthPendingCompleteCleanup(options.pendingStatePath, op)
    if (!cleanupResult.success) return cleanupResult
    return createResultError(op, "OAuth grant did not include the required Search Console scope")
  }

  const credentialsResult = await googleSearchConsoleOAuthCredentialsPersist(options.credentialsPath, {
    clientId: pendingResult.data.clientId,
    clientSecret: pendingResult.data.clientSecret,
    refreshToken: exchangeResult.data.refresh_token,
    tokenUrl: pendingResult.data.tokenUrl,
  })
  if (!credentialsResult.success) return credentialsResult

  const cleanupResult = await googleSearchConsoleOAuthPendingCompleteCleanup(options.pendingStatePath, op)
  if (!cleanupResult.success) return cleanupResult
  return createResult(undefined)
}

async function googleSearchConsoleOAuthPendingCompleteCleanup(path: string, op: string): Promise<Result<void>> {
  try {
    await unlink(path)
    return createResult(undefined)
  } catch (error) {
    if (googleSearchConsoleOAuthPendingCompleteIsMissing(error)) return createResult(undefined)
    return createResultError(op, "Unable to remove pending OAuth state")
  }
}

function googleSearchConsoleOAuthPendingCompleteIsMissing(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT"
}
