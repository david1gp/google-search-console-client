import { readFile } from "node:fs/promises"
import { homedir } from "node:os"
import { join } from "node:path"
import * as v from "valibot"
import { createResult, createResultError, type Result } from "#result"
import { googleSearchConsoleAccessTokenSchema } from "../shared/googleSearchConsoleAccessTokenSchema.js"
import { googleSearchConsoleApiKeySchema } from "../shared/googleSearchConsoleApiKeySchema.js"
import type { GoogleSearchConsoleConfig } from "../shared/googleSearchConsoleConfigSchema.js"
import { googleSearchConsoleConfigSchema } from "../shared/googleSearchConsoleConfigSchema.js"
import { googleSearchConsoleUrlSchema } from "../shared/googleSearchConsoleUrlSchema.js"

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

const googleSearchConsoleCliCredentialsFileSchema = v.pipe(
  v.object({
    accessToken: v.optional(googleSearchConsoleAccessTokenSchema),
    mobileFriendlyApiKey: v.optional(googleSearchConsoleApiKeySchema),
    baseUrl: v.optional(googleSearchConsoleUrlSchema),
    urlInspectionBaseUrl: v.optional(googleSearchConsoleUrlSchema),
  }),
  v.check(
    (credentials) => credentials.accessToken !== undefined || credentials.mobileFriendlyApiKey !== undefined,
    "accessToken or mobileFriendlyApiKey is required",
  ),
)

type GoogleSearchConsoleCliCredentialsFileValues = v.InferOutput<typeof googleSearchConsoleCliCredentialsFileSchema>

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
  const credentialsFilePath = googleSearchConsoleCliCredentialsFilePathResolve(environment, options.env === undefined)
  const credentialsFileResult = await googleSearchConsoleCliCredentialsFileLoad(
    credentialsFilePath,
    environment.GOOGLE_SEARCH_CONSOLE_CREDENTIALS_FILE !== undefined,
  )
  if (!credentialsFileResult.success) return createResultError(op, credentialsFileResult.errorMessage)

  const credentialsFileValues = credentialsFileResult.data
  const input = {
    accessToken:
      options.accessToken ??
      environment.GOOGLE_SEARCH_CONSOLE_ACCESS_TOKEN ??
      environment.GOOGLE_ACCESS_TOKEN ??
      fileValues.GOOGLE_SEARCH_CONSOLE_ACCESS_TOKEN ??
      fileValues.GOOGLE_ACCESS_TOKEN ??
      credentialsFileValues.accessToken,
    mobileFriendlyApiKey:
      options.mobileFriendlyApiKey ??
      options.apiKey ??
      environment.GOOGLE_SEARCH_CONSOLE_MOBILE_FRIENDLY_API_KEY ??
      environment.GOOGLE_SEARCH_CONSOLE_API_KEY ??
      environment.GOOGLE_API_KEY ??
      fileValues.GOOGLE_SEARCH_CONSOLE_MOBILE_FRIENDLY_API_KEY ??
      fileValues.GOOGLE_SEARCH_CONSOLE_API_KEY ??
      fileValues.GOOGLE_API_KEY ??
      credentialsFileValues.mobileFriendlyApiKey,
    baseUrl:
      options.baseUrl ??
      environment.GOOGLE_SEARCH_CONSOLE_BASE_URL ??
      fileValues.GOOGLE_SEARCH_CONSOLE_BASE_URL ??
      credentialsFileValues.baseUrl,
    urlInspectionBaseUrl:
      options.urlInspectionBaseUrl ??
      environment.GOOGLE_SEARCH_CONSOLE_URL_INSPECTION_BASE_URL ??
      fileValues.GOOGLE_SEARCH_CONSOLE_URL_INSPECTION_BASE_URL ??
      credentialsFileValues.urlInspectionBaseUrl,
  }
  const parsed = v.safeParse(googleSearchConsoleConfigSchema, input)
  if (!parsed.success) return createResultError(op, v.summarize(parsed.issues))

  return createResult(parsed.output)
}

function googleSearchConsoleCliCredentialsFilePathResolve(
  environment: GoogleSearchConsoleCliEnvironment,
  useProcessHomeDirectory: boolean,
): string | undefined {
  const override = environment.GOOGLE_SEARCH_CONSOLE_CREDENTIALS_FILE
  if (override !== undefined) return override

  const homeDirectory = environment.HOME ?? environment.USERPROFILE
  if (homeDirectory !== undefined) return join(homeDirectory, ".config/google-search-console/credentials.json")
  if (!useProcessHomeDirectory) return undefined
  return join(homedir(), ".config/google-search-console/credentials.json")
}

async function googleSearchConsoleCliCredentialsFileLoad(
  path: string | undefined,
  explicit: boolean,
): Promise<Result<GoogleSearchConsoleCliCredentialsFileValues>> {
  const op = "googleSearchConsoleCliCredentialsFileLoad"
  if (path === undefined) return createResult({})

  let text: string
  try {
    text = await readFile(path, "utf8")
  } catch (error) {
    if (!explicit && googleSearchConsoleCliCredentialsFileErrorIsMissing(error)) return createResult({})
    return createResultError(
      op,
      `Unable to read credentials file "${path}": ${error instanceof Error ? error.message : String(error)}`,
    )
  }

  let value: unknown
  try {
    value = JSON.parse(text)
  } catch (error) {
    return createResultError(
      op,
      `Unable to parse credentials file "${path}": ${error instanceof Error ? error.message : String(error)}`,
    )
  }

  const parsed = v.safeParse(googleSearchConsoleCliCredentialsFileSchema, value)
  if (!parsed.success) return createResultError(op, `Invalid credentials file "${path}": ${v.summarize(parsed.issues)}`)
  return createResult(parsed.output)
}

function googleSearchConsoleCliCredentialsFileErrorIsMissing(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT"
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
