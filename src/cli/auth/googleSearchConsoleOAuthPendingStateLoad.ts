import { lstat, readFile, unlink } from "node:fs/promises"
import * as v from "valibot"
import { createResult, createResultError, type Result } from "#result"
import {
  type GoogleSearchConsoleOAuthPendingState,
  googleSearchConsoleOAuthPendingStateSchema,
} from "./googleSearchConsoleOAuthPendingStateSchema.js"

const googleSearchConsoleOAuthPendingStateExpirationMs = 15 * 60 * 1_000

export async function googleSearchConsoleOAuthPendingStateLoad(
  path: string,
): Promise<Result<GoogleSearchConsoleOAuthPendingState>> {
  const op = "googleSearchConsoleOAuthPendingStateLoad"

  let fileMode: number
  let text: string
  try {
    const file = await lstat(path)
    if (!file.isFile()) return createResultError(op, "Pending OAuth state must be a regular file")
    fileMode = file.mode
    text = await readFile(path, "utf8")
  } catch {
    return createResultError(op, "Unable to read pending OAuth state")
  }

  if ((fileMode & 0o077) !== 0) return createResultError(op, "Pending OAuth state file permissions are too broad")

  let value: unknown
  try {
    value = JSON.parse(text)
  } catch {
    return createResultError(op, "Invalid pending OAuth state")
  }

  const parsed = v.safeParse(googleSearchConsoleOAuthPendingStateSchema, value)
  if (!parsed.success) return createResultError(op, "Invalid pending OAuth state")

  if (Date.now() - parsed.output.createdAt >= googleSearchConsoleOAuthPendingStateExpirationMs) {
    try {
      await unlink(path)
    } catch (error) {
      if (!googleSearchConsoleOAuthPendingStateLoadIsMissing(error))
        return createResultError(op, "Unable to remove expired pending OAuth state")
    }
    return createResultError(op, "Pending OAuth state has expired")
  }

  return createResult(parsed.output)
}

function googleSearchConsoleOAuthPendingStateLoadIsMissing(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT"
}
