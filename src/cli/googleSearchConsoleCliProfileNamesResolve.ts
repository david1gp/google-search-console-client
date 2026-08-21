import { readdir, stat } from "node:fs/promises"
import { dirname, join } from "node:path"
import * as v from "valibot"
import { createResult, createResultError, type Result } from "#result"
import type { GoogleSearchConsoleCliEnvironment } from "./googleSearchConsoleCliConfigCreate.js"
import { googleSearchConsoleCliProfileCredentialsFilePathResolve } from "./googleSearchConsoleCliConfigCreate.js"
import { googleSearchConsoleCliProfileNameSchema } from "./googleSearchConsoleCliProfileNameSchema.js"

export async function googleSearchConsoleCliProfileNamesResolve(
  environment?: GoogleSearchConsoleCliEnvironment,
): Promise<Result<readonly string[]>> {
  const op = "googleSearchConsoleCliProfileNamesResolve"
  const environmentValues = environment ?? process.env
  if (environmentValues.GOOGLE_SEARCH_CONSOLE_CREDENTIALS_FILE !== undefined) {
    return createResultError(op, "Cannot use --all-profiles with GOOGLE_SEARCH_CONSOLE_CREDENTIALS_FILE")
  }

  const defaultPathResult = googleSearchConsoleCliProfileCredentialsFilePathResolve(
    environmentValues,
    "default",
    environment === undefined,
  )
  if (!defaultPathResult.success) return { ...defaultPathResult, op }
  const defaultPath = defaultPathResult.data
  if (defaultPath === undefined) return createResult([])

  const defaultConfiguredResult = await googleSearchConsoleCliProfilePathConfigured(defaultPath)
  if (!defaultConfiguredResult.success) return defaultConfiguredResult

  let profileEntries: readonly import("node:fs").Dirent[] = []
  try {
    profileEntries = await readdir(join(dirname(defaultPath), "profiles"), { withFileTypes: true })
  } catch (error) {
    if (!googleSearchConsoleCliProfilePathIsMissing(error)) {
      return createResultError(
        op,
        `Unable to discover credential profiles: ${error instanceof Error ? error.message : String(error)}`,
      )
    }
  }

  const namedProfiles: string[] = []
  for (const entry of profileEntries) {
    if (!entry.isDirectory() || entry.name === "default") continue
    const parsed = v.safeParse(googleSearchConsoleCliProfileNameSchema, entry.name)
    if (!parsed.success) {
      return createResultError(
        op,
        `Invalid credential profile directory "${entry.name}": ${v.summarize(parsed.issues)}`,
      )
    }
    namedProfiles.push(parsed.output)
  }
  namedProfiles.sort(googleSearchConsoleCliProfileNameCompare)

  return createResult([...(defaultConfiguredResult.data ? ["default"] : []), ...namedProfiles])
}

async function googleSearchConsoleCliProfilePathConfigured(path: string): Promise<Result<boolean>> {
  const op = "googleSearchConsoleCliProfileNamesResolve"
  try {
    await stat(path)
    return createResult(true)
  } catch (error) {
    if (googleSearchConsoleCliProfilePathIsMissing(error)) return createResult(false)
    return createResultError(
      op,
      `Unable to inspect credential profile: ${error instanceof Error ? error.message : String(error)}`,
    )
  }
}

function googleSearchConsoleCliProfilePathIsMissing(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT"
}

function googleSearchConsoleCliProfileNameCompare(left: string, right: string): number {
  if (left < right) return -1
  if (left > right) return 1
  return 0
}
