import { buildCommand } from "@stricli/core"
import { sitemapsList } from "../../sitemaps/list/sitemapsList.js"
import { googleSearchConsoleCliCommandExecute } from "../googleSearchConsoleCliCommandExecute.js"
import type { GoogleSearchConsoleCliFlags } from "../googleSearchConsoleCliFlags.js"
import { googleSearchConsoleCliOptions } from "../googleSearchConsoleCliOptions.js"
import type { GoogleSearchConsoleCommandContext } from "../googleSearchConsoleCommandContext.js"

export const sitemapsListCommand = buildCommand<
  GoogleSearchConsoleCliFlags,
  [siteUrl: string, sitemapIndex?: string],
  GoogleSearchConsoleCommandContext
>({
  func: async function (flags, siteUrl, sitemapIndex) {
    return googleSearchConsoleCliCommandExecute(this, {
      clientInput: flags,
      execute: (client) => sitemapsList(client, siteUrl, sitemapIndex),
      op: "sitemapsList",
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
          brief: "Sitemap index URL",
          placeholder: "sitemap-index",
          optional: true,
          parse: (input) => input,
        },
      ],
    },
  },
  docs: {
    brief: "List submitted Search Console sitemaps",
  },
})
