import { type ApplicationText, text_en } from "@stricli/core"
import { createResultError } from "#result"

function googleSearchConsoleCliExceptionMessage(exception: unknown): string {
  return exception instanceof Error ? exception.message : String(exception)
}

function googleSearchConsoleCliError(op: string, message: string): string {
  return JSON.stringify(createResultError(op, message))
}

export const googleSearchConsoleCliApplicationText = {
  ...text_en,
  exceptionWhileParsingArguments(exception: unknown) {
    return googleSearchConsoleCliError("cliArgumentParse", googleSearchConsoleCliExceptionMessage(exception))
  },
  exceptionWhileLoadingCommandFunction(exception: unknown) {
    return googleSearchConsoleCliError("cliCommandLoad", googleSearchConsoleCliExceptionMessage(exception))
  },
  exceptionWhileLoadingCommandContext(exception: unknown) {
    return googleSearchConsoleCliError("cliContextLoad", googleSearchConsoleCliExceptionMessage(exception))
  },
  exceptionWhileRunningCommand(exception: unknown) {
    return googleSearchConsoleCliError("cliCommandRun", googleSearchConsoleCliExceptionMessage(exception))
  },
  commandErrorResult(error: Error) {
    return googleSearchConsoleCliError("cliCommandRun", error.message)
  },
  noCommandRegisteredForInput(args: {
    readonly input: string
    readonly corrections: readonly string[]
    readonly ansiColor: boolean
  }) {
    const correction = args.corrections.length > 0 ? ` Did you mean ${args.corrections.join(", ")}?` : ""
    return googleSearchConsoleCliError("cliCommandRoute", `No command registered for ${args.input}.${correction}`)
  },
  noTextAvailableForLocale(args: {
    readonly requestedLocale: string
    readonly defaultLocale: string
    readonly ansiColor: boolean
  }) {
    return googleSearchConsoleCliError(
      "cliLocale",
      `No text available for locale ${args.requestedLocale}; using ${args.defaultLocale}`,
    )
  },
  exceptionWhileRunningIntegrationHook(args: {
    readonly exception: unknown
    readonly hook: string
    readonly integration: string
    readonly ansiColor: boolean
  }) {
    return googleSearchConsoleCliError(
      "cliIntegrationHook",
      `${args.integration} failed during ${args.hook}: ${googleSearchConsoleCliExceptionMessage(args.exception)}`,
    )
  },
  exceptionWhileRunningIntegrationFlag(args: {
    readonly exception: unknown
    readonly integration: string
    readonly ansiColor: boolean
  }) {
    return googleSearchConsoleCliError(
      "cliIntegrationFlag",
      `${args.integration} failed: ${googleSearchConsoleCliExceptionMessage(args.exception)}`,
    )
  },
} satisfies ApplicationText
