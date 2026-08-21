import { buildCommand } from "@stricli/core"
import { createResultError } from "#result"
import { sitesList } from "../../sites/list/sitesList.js"
import { googleSearchConsoleCliCommandExecute } from "../googleSearchConsoleCliCommandExecute.js"
import type { GoogleSearchConsoleCliFlags } from "../googleSearchConsoleCliFlags.js"
import { googleSearchConsoleCliOptions } from "../googleSearchConsoleCliOptions.js"
import { googleSearchConsoleCliResultWrite } from "../googleSearchConsoleCliResultWrite.js"
import type { GoogleSearchConsoleCommandContext } from "../googleSearchConsoleCommandContext.js"
import { sitesListAllProfiles } from "./sitesListAllProfiles.js"

type SitesListCommandFlags = GoogleSearchConsoleCliFlags & {
  readonly allProfiles?: boolean
}

const sitesListCommandOptions = {
  ...googleSearchConsoleCliOptions,
  allProfiles: {
    brief: "List sites from all configured credential profiles",
    kind: "boolean" as const,
    optional: true as const,
  },
}

export const sitesListCommand = buildCommand<SitesListCommandFlags, [], GoogleSearchConsoleCommandContext>({
  func: async function (flags) {
    if (flags.allProfiles === true) {
      if (flags.profile !== undefined) {
        googleSearchConsoleCliResultWrite(
          this.process,
          createResultError("sitesListAllProfiles", "--all-profiles cannot be combined with --profile"),
        )
        return
      }
      if (this.client !== undefined) {
        googleSearchConsoleCliResultWrite(
          this.process,
          createResultError("sitesListAllProfiles", "--all-profiles requires CLI credential profiles"),
        )
        return
      }
      const result = await sitesListAllProfiles(flags, this.process.env)
      googleSearchConsoleCliResultWrite(this.process, result)
      return
    }

    return googleSearchConsoleCliCommandExecute(this, {
      clientInput: flags,
      execute: (client) => sitesList(client),
      op: "sitesList",
    })
  },
  parameters: {
    flags: sitesListCommandOptions,
  },
  docs: {
    brief: "List Search Console sites",
  },
})
