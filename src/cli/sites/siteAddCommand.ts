import { buildCommand } from "@stricli/core"
import { siteAdd } from "../../sites/add/siteAdd.js"
import { googleSearchConsoleCliCommandExecute } from "../googleSearchConsoleCliCommandExecute.js"
import type { GoogleSearchConsoleCliFlags } from "../googleSearchConsoleCliFlags.js"
import { googleSearchConsoleCliOptions } from "../googleSearchConsoleCliOptions.js"
import type { GoogleSearchConsoleCommandContext } from "../googleSearchConsoleCommandContext.js"

export const siteAddCommand = buildCommand<
  GoogleSearchConsoleCliFlags,
  [siteUrl: string],
  GoogleSearchConsoleCommandContext
>({
  func: async function (flags, siteUrl) {
    return googleSearchConsoleCliCommandExecute(this, {
      clientInput: flags,
      execute: (client) => siteAdd(client, siteUrl),
      op: "siteAdd",
    })
  },
  parameters: {
    flags: googleSearchConsoleCliOptions,
    positional: {
      kind: "tuple",
      parameters: [
        {
          brief: "Search Console site URL",
          placeholder: "site-url",
          parse: (input) => input,
        },
      ],
    },
  },
  docs: {
    brief: "Add a Search Console site",
  },
})
