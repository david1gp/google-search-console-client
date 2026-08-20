import type { GoogleSearchConsoleConfig } from "./googleSearchConsoleConfigSchema.js"
import type { GoogleSearchConsoleFetch } from "./googleSearchConsoleFetch.js"

export type GoogleSearchConsoleClient = {
  config: GoogleSearchConsoleConfig
  fetch: GoogleSearchConsoleFetch
}
