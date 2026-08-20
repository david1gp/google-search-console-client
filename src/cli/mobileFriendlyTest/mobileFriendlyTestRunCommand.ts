import { buildCommand } from "@stricli/core"
import { mobileFriendlyTestRun } from "../../mobileFriendlyTest/run/mobileFriendlyTestRun.js"
import { googleSearchConsoleCliCommandExecute } from "../googleSearchConsoleCliCommandExecute.js"
import type { GoogleSearchConsoleCliFlags } from "../googleSearchConsoleCliFlags.js"
import { googleSearchConsoleCliOptions } from "../googleSearchConsoleCliOptions.js"
import type { GoogleSearchConsoleCommandContext } from "../googleSearchConsoleCommandContext.js"

type MobileFriendlyTestRunCommandFlags = GoogleSearchConsoleCliFlags & {
  requestScreenshot?: boolean
}

export const mobileFriendlyTestRunCommand = buildCommand<
  MobileFriendlyTestRunCommandFlags,
  [url: string],
  GoogleSearchConsoleCommandContext
>({
  func: async function (flags, url) {
    return googleSearchConsoleCliCommandExecute(this, {
      clientInput: flags,
      execute: (client) =>
        mobileFriendlyTestRun(client, {
          url,
          requestScreenshot: flags.requestScreenshot,
        }),
      op: "mobileFriendlyTestRun",
    })
  },
  parameters: {
    flags: {
      ...googleSearchConsoleCliOptions,
      requestScreenshot: {
        brief: "Include a screenshot in the response",
        kind: "boolean",
        optional: true,
      },
    },
    positional: {
      kind: "tuple",
      parameters: [
        {
          brief: "URL to test",
          placeholder: "url",
          parse: (input) => input,
        },
      ],
    },
  },
  docs: {
    brief: "Run the Mobile-Friendly Test",
  },
})
