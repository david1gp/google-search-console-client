import { type Application, run, type StricliProcess } from "@stricli/core"
import { createResult, createResultError } from "#result"
import type { GoogleSearchConsoleCommandContext } from "./googleSearchConsoleCommandContext.js"

type GoogleSearchConsoleCliRunOutput = {
  stdout: string
  stderr: string
}

export async function googleSearchConsoleCliRun(
  application: Application<GoogleSearchConsoleCommandContext>,
  inputs: readonly string[],
  process: StricliProcess,
): Promise<void> {
  const output: GoogleSearchConsoleCliRunOutput = { stdout: "", stderr: "" }
  const runProcess = googleSearchConsoleCliRunProcessCreate(process, output)

  try {
    await run(application, inputs, {
      process: runProcess,
    })
  } catch (error) {
    runProcess.exitCode = 1
    output.stderr += `${JSON.stringify(createResultError("cliRun", error instanceof Error ? error.message : String(error)))}\n`
  }

  googleSearchConsoleCliRunOutputWrite(process, output)
  if (process.exitCode !== undefined && process.exitCode !== null && Number(process.exitCode) !== 0) {
    process.exitCode = 1
    return
  }
  process.exitCode = 0
}

function googleSearchConsoleCliRunProcessCreate(
  process: StricliProcess,
  output: GoogleSearchConsoleCliRunOutput,
): StricliProcess {
  return {
    env: process.env,
    get exitCode() {
      return process.exitCode
    },
    set exitCode(value) {
      process.exitCode = value
    },
    stdout: googleSearchConsoleCliRunStreamCreate(process.stdout, output, "stdout"),
    stderr: googleSearchConsoleCliRunStreamCreate(process.stderr, output, "stderr"),
  }
}

function googleSearchConsoleCliRunStreamCreate(
  stream: StricliProcess["stdout"],
  output: GoogleSearchConsoleCliRunOutput,
  key: keyof GoogleSearchConsoleCliRunOutput,
): StricliProcess["stdout"] {
  return {
    write(value: string) {
      output[key] += value
    },
    getColorDepth: stream.getColorDepth === undefined ? undefined : (env) => stream.getColorDepth?.(env) ?? 1,
  }
}

function googleSearchConsoleCliRunOutputWrite(process: StricliProcess, output: GoogleSearchConsoleCliRunOutput): void {
  const stdout = googleSearchConsoleCliRunOutputNormalize(output.stdout, true)
  if (stdout !== undefined) process.stdout.write(`${stdout}\n`)

  const stderr = googleSearchConsoleCliRunOutputNormalize(output.stderr, false)
  if (stderr !== undefined) process.stderr.write(`${stderr}\n`)
}

function googleSearchConsoleCliRunOutputNormalize(value: string, success: boolean): string | undefined {
  const trimmed = value.trim()
  if (trimmed.length === 0) return undefined

  try {
    JSON.parse(trimmed)
    return trimmed
  } catch {
    return JSON.stringify(success ? createResult(trimmed) : createResultError("cliOutput", trimmed))
  }
}
