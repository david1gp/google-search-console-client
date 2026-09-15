import { readdir, readFile } from "node:fs/promises"
import { dirname, join } from "node:path"
import * as v from "valibot"
import { createResult, type Result } from "#result"
import { googleSearchConsoleAccessTokenSchema } from "../shared/googleSearchConsoleAccessTokenSchema.js"
import type { GoogleSearchConsoleCliEnvironment } from "./googleSearchConsoleCliConfigCreate.js"
import { googleSearchConsoleCliProfileCredentialsFilePathResolve } from "./googleSearchConsoleCliConfigCreate.js"

export type GoogleSearchConsoleCliDiscoveredOAuthClientCredentials = {
  readonly clientId?: string
  readonly clientSecret?: string
}

const googleSearchConsoleDiscoveredCredentialsSchema = v.pipe(
  v.object({
    client_id: v.optional(googleSearchConsoleAccessTokenSchema),
    client_secret: v.optional(googleSearchConsoleAccessTokenSchema),
    oauth: v.optional(
      v.object({
        clientId: v.optional(googleSearchConsoleAccessTokenSchema),
        clientSecret: v.optional(googleSearchConsoleAccessTokenSchema),
      }),
    ),
  }),
  v.transform((input) => {
    const clientId = input.oauth?.clientId ?? input.client_id
    const clientSecret = input.oauth?.clientSecret ?? input.client_secret
    return {
      ...(clientId === undefined ? {} : { clientId }),
      ...(clientSecret === undefined ? {} : { clientSecret }),
    }
  }),
)

export async function googleSearchConsoleCliOAuthClientCredentialsDiscover(
  environment: GoogleSearchConsoleCliEnvironment,
): Promise<Result<GoogleSearchConsoleCliDiscoveredOAuthClientCredentials>> {
  const defaultPathResult = googleSearchConsoleCliProfileCredentialsFilePathResolve(
    environment,
    "default",
    environment.HOME === undefined && environment.USERPROFILE === undefined,
  )
  if (!defaultPathResult.success || defaultPathResult.data === undefined) {
    return createResult({})
  }

  const defaultCredentialsPath = defaultPathResult.data
  const configDirectory = dirname(defaultCredentialsPath)

  const defaultCreds = await googleSearchConsoleDiscoveredCredentialsRead(defaultCredentialsPath)
  if (defaultCreds?.clientId !== undefined) {
    return createResult(defaultCreds)
  }

  const profilesDirectory = join(configDirectory, "profiles")
  let profileEntries: readonly import("node:fs").Dirent[] = []
  try {
    profileEntries = await readdir(profilesDirectory, { withFileTypes: true })
  } catch {
    return createResult(defaultCreds ?? {})
  }

  for (const entry of profileEntries) {
    if (!entry.isDirectory() && !entry.isSymbolicLink()) continue
    const candidatePath = join(profilesDirectory, entry.name, "credentials.json")
    if (candidatePath === defaultCredentialsPath) continue
    const candidateCreds = await googleSearchConsoleDiscoveredCredentialsRead(candidatePath)
    if (candidateCreds?.clientId !== undefined) {
      return createResult(candidateCreds)
    }
  }

  return createResult(defaultCreds ?? {})
}

async function googleSearchConsoleDiscoveredCredentialsRead(
  filePath: string,
): Promise<GoogleSearchConsoleCliDiscoveredOAuthClientCredentials | undefined> {
  let text: string
  try {
    text = await readFile(filePath, "utf8")
  } catch {
    return undefined
  }

  let value: unknown
  try {
    value = JSON.parse(text)
  } catch {
    return undefined
  }

  const parsed = v.safeParse(googleSearchConsoleDiscoveredCredentialsSchema, value)
  if (!parsed.success) return undefined
  return parsed.output
}
