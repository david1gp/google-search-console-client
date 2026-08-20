import type { Result } from "#result"
import type { GoogleSearchConsoleConfig } from "./googleSearchConsoleConfigSchema.js"
import type { GoogleSearchConsoleFetch } from "./googleSearchConsoleFetch.js"

export type GoogleSearchConsoleClient = {
  config: GoogleSearchConsoleConfig
  fetch: GoogleSearchConsoleFetch
  oauthTokenCache?: {
    accessToken?: string
    expiresAt?: number
    refreshPromise?: Promise<Result<string>>
  }
}
