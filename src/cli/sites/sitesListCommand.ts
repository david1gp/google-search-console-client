import { buildCommand } from "@stricli/core"
import { sitesList } from "../../sites/list/sitesList.js"
import { googleSearchConsoleCliCommandExecute } from "../googleSearchConsoleCliCommandExecute.js"
import type { GoogleSearchConsoleCliFlags } from "../googleSearchConsoleCliFlags.js"
import { googleSearchConsoleCliOptions } from "../googleSearchConsoleCliOptions.js"
import type { GoogleSearchConsoleCommandContext } from "../googleSearchConsoleCommandContext.js"

export const sitesListCommand = buildCommand<GoogleSearchConsoleCliFlags, [], GoogleSearchConsoleCommandContext>({
  func: async function (flags) {
    return googleSearchConsoleCliCommandExecute(this, {
      clientInput: flags,
      execute: (client) => sitesList(client),
      op: "sitesList",
    })
  },
  parameters: {
    flags: googleSearchConsoleCliOptions,
  },
  docs: {
    brief: "List Search Console sites",
  },
})
