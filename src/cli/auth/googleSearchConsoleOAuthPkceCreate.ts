import { createHash, randomBytes } from "node:crypto"
import { createResult, createResultError, type Result } from "#result"

export type GoogleSearchConsoleOAuthPkce = {
  readonly codeChallenge: string
  readonly codeVerifier: string
}

export function googleSearchConsoleOAuthPkceCreate(): Result<GoogleSearchConsoleOAuthPkce> {
  const op = "googleSearchConsoleOAuthPkceCreate"

  try {
    const codeVerifier = googleSearchConsoleOAuthPkceBase64UrlEncode(randomBytes(32))
    const codeChallenge = googleSearchConsoleOAuthPkceBase64UrlEncode(
      createHash("sha256").update(codeVerifier).digest(),
    )
    return createResult({ codeChallenge, codeVerifier })
  } catch {
    return createResultError(op, "Unable to create OAuth PKCE values")
  }
}

function googleSearchConsoleOAuthPkceBase64UrlEncode(value: Uint8Array): string {
  return Buffer.from(value).toString("base64url")
}
