import { buildCommand } from "@stricli/core"
import { sitemapGet } from "../../sitemaps/get/sitemapGet.js"
import { googleSearchConsoleCliCommandExecute } from "../googleSearchConsoleCliCommandExecute.js"
import type { GoogleSearchConsoleCliFlags } from "../googleSearchConsoleCliFlags.js"
import { googleSearchConsoleCliOptions } from "../googleSearchConsoleCliOptions.js"
import type { GoogleSearchConsoleCommandContext } from "../googleSearchConsoleCommandContext.js"

export const sitemapGetCommand = buildCommand<
  GoogleSearchConsoleCliFlags,
  [siteUrl: string, feedpath: string],
  GoogleSearchConsoleCommandContext
>({
  func: async function (flags, siteUrl, feedpath) {
    return googleSearchConsoleCliCommandExecute(this, {
      clientInput: flags,
      execute: (client) => sitemapGet(client, siteUrl, feedpath),
      op: "sitemapGet",
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
        {
          brief: "Sitemap URL",
          placeholder: "feedpath",
          parse: (input) => input,
        },
      ],
    },
  },
  docs: {
    brief: "Get a Search Console sitemap",
  },
})
