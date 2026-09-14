import { readFile } from "node:fs/promises"
import { createResult, createResultError, type Result } from "#result"
import type { GoogleSearchConsoleCliEnvironment } from "./googleSearchConsoleCliConfigCreate.js"
import { googleSearchConsoleCliEnvFileParse } from "./googleSearchConsoleCliEnvFileParse.js"

export async function googleSearchConsoleCliCloudflareApiTokenResolve(
  environment: GoogleSearchConsoleCliEnvironment,
  envFile?: string,
): Promise<Result<string>> {
  const op = "googleSearchConsoleCliCloudflareApiTokenResolve"
  const directValue = environment.CLOUDFLARE_API_TOKEN
  if (directValue !== undefined && directValue.length > 0) return createResult(directValue)

  if (envFile !== undefined) {
    let text: string
    try {
      text = await readFile(envFile, "utf8")
    } catch (error) {
      return createResultError(
        op,
        `Unable to read env file "${envFile}": ${error instanceof Error ? error.message : String(error)}`,
      )
    }
    const parsed = googleSearchConsoleCliEnvFileParse(text)
    if (!parsed.success) return parsed
    const fileValue = parsed.data.CLOUDFLARE_API_TOKEN
    if (fileValue !== undefined && fileValue.length > 0) return createResult(fileValue)
  }

  return createResultError(op, "CLOUDFLARE_API_TOKEN is required; set it in the environment or --env-file")
}
