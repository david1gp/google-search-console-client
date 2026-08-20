import { buildCommand } from "@stricli/core"
import { siteDelete } from "../../sites/delete/siteDelete.js"
import { googleSearchConsoleCliCommandExecute } from "../googleSearchConsoleCliCommandExecute.js"
import type { GoogleSearchConsoleCliFlags } from "../googleSearchConsoleCliFlags.js"
import { googleSearchConsoleCliOptions } from "../googleSearchConsoleCliOptions.js"
import type { GoogleSearchConsoleCommandContext } from "../googleSearchConsoleCommandContext.js"

export const siteDeleteCommand = buildCommand<
  GoogleSearchConsoleCliFlags,
  [siteUrl: string],
  GoogleSearchConsoleCommandContext
>({
  func: async function (flags, siteUrl) {
    return googleSearchConsoleCliCommandExecute(this, {
      clientInput: flags,
      execute: (client) => siteDelete(client, siteUrl),
      op: "siteDelete",
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
    brief: "Delete a Search Console site",
  },
})
