import { randomBytes } from "node:crypto"
import { chmod, mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises"
import { dirname } from "node:path"
import * as v from "valibot"
import { createResult, createResultError, type Result } from "#result"
import { googleSearchConsoleAccessTokenSchema } from "../../shared/googleSearchConsoleAccessTokenSchema.js"
import { type GoogleSearchConsoleOAuthConfigInput } from "../../shared/googleSearchConsoleOAuthConfigSchema.js"
import { googleSearchConsoleUrlSchema } from "../../shared/googleSearchConsoleUrlSchema.js"

const googleSearchConsoleOAuthCredentialsPersistSchema = v.object({
  clientId: googleSearchConsoleAccessTokenSchema,
  clientSecret: v.optional(googleSearchConsoleAccessTokenSchema),
  refreshToken: v.optional(googleSearchConsoleAccessTokenSchema),
  tokenUrl: v.optional(googleSearchConsoleUrlSchema, "https://oauth2.googleapis.com/token"),
})

export async function googleSearchConsoleOAuthCredentialsPersist(
  path: string,
  credentials: Omit<GoogleSearchConsoleOAuthConfigInput, "refreshToken"> & { readonly refreshToken?: string },
): Promise<Result<void>> {
  const op = "googleSearchConsoleOAuthCredentialsPersist"
  const parsedCredentials = v.safeParse(googleSearchConsoleOAuthCredentialsPersistSchema, credentials)
  if (!parsedCredentials.success) return createResultError(op, "Invalid OAuth credentials")

  let existing: Record<string, unknown> = {}
  try {
    const text = await readFile(path, "utf8")
    const value: unknown = JSON.parse(text)
    if (typeof value !== "object" || value === null || Array.isArray(value))
      return createResultError(op, "Invalid credentials file")
    existing = { ...value }
  } catch (error) {
    if (!googleSearchConsoleOAuthCredentialsPersistErrorIsMissing(error))
      return createResultError(op, "Unable to read credentials file")
  }

  const output = googleSearchConsoleOAuthCredentialsPersistValues(existing, parsedCredentials.output)
  if (!output.success) return output
  const directory = dirname(path)
  let temporaryPath: string | undefined
  try {
    await mkdir(directory, { recursive: true, mode: 0o700 })
    await chmod(directory, 0o700)
    temporaryPath = `${path}.${randomBytes(12).toString("hex")}.tmp`
    await writeFile(temporaryPath, `${JSON.stringify(output.data, null, 2)}\n`, {
      encoding: "utf8",
      flag: "wx",
      mode: 0o600,
    })
    await chmod(temporaryPath, 0o600)
    await rename(temporaryPath, path)
    temporaryPath = undefined
    return createResult(undefined)
  } catch {
    return createResultError(op, "Unable to persist OAuth credentials")
  } finally {
    if (temporaryPath !== undefined) await unlink(temporaryPath).catch(() => undefined)
  }
}

function googleSearchConsoleOAuthCredentialsPersistValues(
  existing: Record<string, unknown>,
  credentials: v.InferOutput<typeof googleSearchConsoleOAuthCredentialsPersistSchema>,
): Result<Record<string, unknown>> {
  const op = "googleSearchConsoleOAuthCredentialsPersistValues"
  const refreshToken =
    credentials.refreshToken ?? googleSearchConsoleOAuthCredentialsPersistRefreshTokenResolve(existing)
  if (refreshToken === undefined) return createResultError(op, "A refresh token is required")

  const output = { ...existing }
  delete output.accessToken
  output.client_id = credentials.clientId
  output.refresh_token = refreshToken
  output.token_uri = credentials.tokenUrl
  if (credentials.clientSecret === undefined) delete output.client_secret
  else output.client_secret = credentials.clientSecret

  if (typeof output.oauth === "object" && output.oauth !== null && !Array.isArray(output.oauth)) {
    const oauth = { ...(output.oauth as Record<string, unknown>) }
    oauth.clientId = credentials.clientId
    oauth.refreshToken = refreshToken
    oauth.tokenUrl = credentials.tokenUrl
    if (credentials.clientSecret === undefined) delete oauth.clientSecret
    else oauth.clientSecret = credentials.clientSecret
    output.oauth = oauth
  }

  return createResult(output)
}

function googleSearchConsoleOAuthCredentialsPersistRefreshTokenResolve(
  existing: Record<string, unknown>,
): string | undefined {
  const nested = existing.oauth
  if (typeof existing.refresh_token === "string" && existing.refresh_token.length > 0) return existing.refresh_token
  if (typeof nested !== "object" || nested === null || Array.isArray(nested)) return undefined
  const nestedRefreshToken = (nested as Record<string, unknown>).refreshToken
  return typeof nestedRefreshToken === "string" && nestedRefreshToken.length > 0 ? nestedRefreshToken : undefined
}

function googleSearchConsoleOAuthCredentialsPersistErrorIsMissing(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT"
}
