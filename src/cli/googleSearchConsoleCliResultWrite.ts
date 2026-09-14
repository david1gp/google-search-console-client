import type { StricliProcess } from "@stricli/core"
import type { Result } from "#result"

type GoogleSearchConsoleCliResultOutputFormat = "json" | "plain"

export function googleSearchConsoleCliResultWrite<T>(
  process: StricliProcess,
  result: Result<T>,
  format: GoogleSearchConsoleCliResultOutputFormat = "json",
): void {
  const stream = result.success ? process.stdout : process.stderr
  const output = result.success && format === "plain" ? { ...result, format } : result
  stream.write(`${JSON.stringify(output)}\n`)
  if (!result.success) process.exitCode = 1
}
