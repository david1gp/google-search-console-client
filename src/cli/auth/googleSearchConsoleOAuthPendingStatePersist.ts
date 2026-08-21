import { randomBytes } from "node:crypto"
import { chmod, mkdir, rename, unlink, writeFile } from "node:fs/promises"
import { dirname } from "node:path"
import * as v from "valibot"
import { createResult, createResultError, type Result } from "#result"
import { googleSearchConsoleOAuthPendingStateSchema } from "./googleSearchConsoleOAuthPendingStateSchema.js"

export async function googleSearchConsoleOAuthPendingStatePersist(
  path: string,
  state: v.InferInput<typeof googleSearchConsoleOAuthPendingStateSchema>,
): Promise<Result<void>> {
  const op = "googleSearchConsoleOAuthPendingStatePersist"
  const parsed = v.safeParse(googleSearchConsoleOAuthPendingStateSchema, state)
  if (!parsed.success) return createResultError(op, "Invalid pending OAuth state")

  const directory = dirname(path)
  let temporaryPath: string | undefined
  try {
    await mkdir(directory, { recursive: true, mode: 0o700 })
    await chmod(directory, 0o700)
    temporaryPath = `${path}.${randomBytes(12).toString("hex")}.tmp`
    await writeFile(temporaryPath, `${JSON.stringify(parsed.output, null, 2)}\n`, {
      encoding: "utf8",
      flag: "wx",
      mode: 0o600,
    })
    await chmod(temporaryPath, 0o600)
    await rename(temporaryPath, path)
    temporaryPath = undefined
    return createResult(undefined)
  } catch {
    return createResultError(op, "Unable to persist pending OAuth state")
  } finally {
    if (temporaryPath !== undefined) await unlink(temporaryPath).catch(() => undefined)
  }
}
