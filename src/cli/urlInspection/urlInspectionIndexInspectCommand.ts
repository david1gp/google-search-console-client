import { buildCommand } from "@stricli/core"
import { urlInspectionIndexInspect } from "../../urlInspection/indexInspect/index.js"
import { googleSearchConsoleCliCommandExecute } from "../googleSearchConsoleCliCommandExecute.js"
import type { GoogleSearchConsoleCliFlags } from "../googleSearchConsoleCliFlags.js"
import { googleSearchConsoleCliOptions } from "../googleSearchConsoleCliOptions.js"
import type { GoogleSearchConsoleCommandContext } from "../googleSearchConsoleCommandContext.js"

type UrlInspectionIndexInspectCommandFlags = GoogleSearchConsoleCliFlags & {
  languageCode?: string
}

export const urlInspectionIndexInspectCommand = buildCommand<
  UrlInspectionIndexInspectCommandFlags,
  [inspectionUrl: string, siteUrl: string],
  GoogleSearchConsoleCommandContext
>({
  func: async function (flags, inspectionUrl, siteUrl) {
    return googleSearchConsoleCliCommandExecute(this, {
      clientInput: flags,
      execute: (client) =>
        urlInspectionIndexInspect(client, {
          inspectionUrl,
          siteUrl,
          languageCode: flags.languageCode,
        }),
      op: "urlInspectionIndexInspect",
    })
  },
  parameters: {
    flags: {
      ...googleSearchConsoleCliOptions,
      languageCode: {
        brief: "Language for translated issue messages",
        kind: "parsed",
        optional: true,
        parse: (input) => input,
        placeholder: "language-code",
      },
    },
    positional: {
      kind: "tuple",
      parameters: [
        {
          brief: "URL to inspect",
          placeholder: "inspection-url",
          parse: (input) => input,
        },
        {
          brief: "Search Console site URL",
          placeholder: "site-url",
          parse: (input) => input,
        },
      ],
    },
  },
  docs: {
    brief: "Inspect a URL in Search Console",
  },
})
