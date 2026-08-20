import * as v from "valibot"
import { createResult, createResultError, type Result } from "#result"
import type { GoogleSearchConsoleClient } from "./GoogleSearchConsoleClient.js"
import { googleSearchConsoleConfigSchema } from "./googleSearchConsoleConfigSchema.js"
import type { GoogleSearchConsoleFetch } from "./googleSearchConsoleFetch.js"

export function googleSearchConsoleClientCreate(
  config: v.InferInput<typeof googleSearchConsoleConfigSchema>,
): Result<GoogleSearchConsoleClient> {
  const op = "googleSearchConsoleClientCreate"
  const parsed = v.safeParse(googleSearchConsoleConfigSchema, config)
  if (!parsed.success) return createResultError(op, v.summarize(parsed.issues))

  const fetchFn = parsed.output.fetch ?? globalThis.fetch
  if (typeof fetchFn !== "function") return createResultError(op, "fetch must be a function")

  return createResult({
    config: {
      ...parsed.output,
      fetch: fetchFn as GoogleSearchConsoleFetch,
    },
    fetch: fetchFn as GoogleSearchConsoleFetch,
  })
}
