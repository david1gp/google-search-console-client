import { buildCommand } from "@stricli/core"
import { siteGet } from "../../sites/get/siteGet.js"
import { googleSearchConsoleCliCommandExecute } from "../googleSearchConsoleCliCommandExecute.js"
import type { GoogleSearchConsoleCliFlags } from "../googleSearchConsoleCliFlags.js"
import { googleSearchConsoleCliOptions } from "../googleSearchConsoleCliOptions.js"
import type { GoogleSearchConsoleCommandContext } from "../googleSearchConsoleCommandContext.js"

export const siteGetCommand = buildCommand<
  GoogleSearchConsoleCliFlags,
  [siteUrl: string],
  GoogleSearchConsoleCommandContext
>({
  func: async function (flags, siteUrl) {
    return googleSearchConsoleCliCommandExecute(this, {
      clientInput: flags,
      execute: (client) => siteGet(client, siteUrl),
      op: "siteGet",
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
    brief: "Get a Search Console site",
  },
})
