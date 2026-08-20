import type { StricliProcess } from "@stricli/core"
import type { Result } from "#result"

export function googleSearchConsoleCliResultWrite<T>(process: StricliProcess, result: Result<T>): void {
  const stream = result.success ? process.stdout : process.stderr
  stream.write(`${JSON.stringify(result)}\n`)
  if (!result.success) process.exitCode = 1
}
