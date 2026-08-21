import { randomBytes } from "node:crypto"
import { createResult, createResultError, type Result } from "#result"

export function googleSearchConsoleOAuthStateCreate(): Result<string> {
  const op = "googleSearchConsoleOAuthStateCreate"

  try {
    return createResult(randomBytes(32).toString("base64url"))
  } catch {
    return createResultError(op, "Unable to create OAuth state")
  }
}
