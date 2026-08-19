import * as v from "valibot"
import { type GoogleSearchConsoleConfig, googleSearchConsoleConfigSchema } from "./googleSearchConsoleConfigSchema.js"

export interface GoogleSearchConsoleClient {
  config: GoogleSearchConsoleConfig
}

export function googleSearchConsoleClientCreate(
  config: v.InferInput<typeof googleSearchConsoleConfigSchema>,
): GoogleSearchConsoleClient {
  const parsed = v.parse(googleSearchConsoleConfigSchema, config)
  return {
    config: parsed,
  }
}
