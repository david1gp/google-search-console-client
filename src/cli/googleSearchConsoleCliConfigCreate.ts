import { readFile } from "node:fs/promises"
import * as v from "valibot"
import { createResult, createResultError, type Result } from "#result"
import type { GoogleSearchConsoleConfig } from "../shared/googleSearchConsoleConfigSchema.js"
import { googleSearchConsoleConfigSchema } from "../shared/googleSearchConsoleConfigSchema.js"

export type GoogleSearchConsoleCliEnvironment = Readonly<Record<string, string | undefined>>

export type GoogleSearchConsoleCliConfigCreateOptions = {
  readonly accessToken?: string
  readonly apiKey?: string
  readonly mobileFriendlyApiKey?: string
  readonly baseUrl?: string
  readonly urlInspectionBaseUrl?: string
  readonly config?: unknown
  readonly env?: GoogleSearchConsoleCliEnvironment
  readonly envFile?: string
}

type GoogleSearchConsoleEnvFileValues = Record<string, string>

export async function googleSearchConsoleCliConfigCreate(
  options: GoogleSearchConsoleCliConfigCreateOptions = {},
): Promise<Result<GoogleSearchConsoleConfig>> {
  const op = "googleSearchConsoleCliConfigCreate"

  if (options.config !== undefined) {
    const parsed = v.safeParse(googleSearchConsoleConfigSchema, options.config)
    if (!parsed.success) return createResultError(op, v.summarize(parsed.issues))
    return createResult(parsed.output)
  }

  let fileValues: GoogleSearchConsoleEnvFileValues = {}
  if (options.envFile !== undefined) {
    let text: string
    try {
      text = await readFile(options.envFile, "utf8")
    } catch (error) {
      return createResultError(
        op,
        `Unable to read env file "${options.envFile}": ${error instanceof Error ? error.message : String(error)}`,
      )
    }

    const fileResult = googleSearchConsoleCliEnvFileParse(text)
    if (!fileResult.success) return createResultError(op, fileResult.errorMessage)
    fileValues = fileResult.data
  }

  const environment = options.env ?? process.env
  const input = {
    accessToken:
      options.accessToken ??
      environment.GOOGLE_SEARCH_CONSOLE_ACCESS_TOKEN ??
      environment.GOOGLE_ACCESS_TOKEN ??
      fileValues.GOOGLE_SEARCH_CONSOLE_ACCESS_TOKEN ??
      fileValues.GOOGLE_ACCESS_TOKEN,
    mobileFriendlyApiKey:
      options.mobileFriendlyApiKey ??
      options.apiKey ??
      environment.GOOGLE_SEARCH_CONSOLE_MOBILE_FRIENDLY_API_KEY ??
      environment.GOOGLE_SEARCH_CONSOLE_API_KEY ??
      environment.GOOGLE_API_KEY ??
      fileValues.GOOGLE_SEARCH_CONSOLE_MOBILE_FRIENDLY_API_KEY ??
      fileValues.GOOGLE_SEARCH_CONSOLE_API_KEY ??
      fileValues.GOOGLE_API_KEY,
    baseUrl: options.baseUrl ?? environment.GOOGLE_SEARCH_CONSOLE_BASE_URL ?? fileValues.GOOGLE_SEARCH_CONSOLE_BASE_URL,
    urlInspectionBaseUrl:
      options.urlInspectionBaseUrl ??
      environment.GOOGLE_SEARCH_CONSOLE_URL_INSPECTION_BASE_URL ??
      fileValues.GOOGLE_SEARCH_CONSOLE_URL_INSPECTION_BASE_URL,
  }
  const parsed = v.safeParse(googleSearchConsoleConfigSchema, input)
  if (!parsed.success) return createResultError(op, v.summarize(parsed.issues))

  return createResult(parsed.output)
}

function googleSearchConsoleCliEnvFileParse(text: string): Result<GoogleSearchConsoleEnvFileValues> {
  const op = "googleSearchConsoleCliEnvFileParse"
  const values: GoogleSearchConsoleEnvFileValues = {}

  for (const [index, sourceLine] of text.split(/\r?\n/).entries()) {
    const line = sourceLine.replace(/^\uFEFF/, "").trim()
    if (line === "" || line.startsWith("#")) continue

    const match = /^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(line)
    if (!match) return createResultError(op, `Invalid .env entry on line ${index + 1}`)

    const key = match[1]
    const rawValueSource = match[2]
    if (key === undefined || rawValueSource === undefined) {
      return createResultError(op, `Invalid .env entry on line ${index + 1}`)
    }

    const rawValue = rawValueSource.trim()
    const quote = rawValue[0]
    if (quote === "'" || quote === '"') {
      if (rawValue.length < 2 || rawValue.at(-1) !== quote) {
        return createResultError(op, `Unclosed quote on line ${index + 1}`)
      }
      values[key] = rawValue.slice(1, -1)
      continue
    }

    values[key] = rawValue.replace(/\s+#.*$/, "").trim()
  }

  return createResult(values)
}
