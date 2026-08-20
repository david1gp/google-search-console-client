import type { CommandContext, StricliProcess } from "@stricli/core"
import type { GoogleSearchConsoleClient } from "../shared/GoogleSearchConsoleClient.js"

export type GoogleSearchConsoleCommandContext = Omit<CommandContext, "process"> & {
  readonly client?: GoogleSearchConsoleClient
  readonly process: StricliProcess
}
