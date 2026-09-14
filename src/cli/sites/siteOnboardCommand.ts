import { buildCommand } from "@stricli/core"
import { googleSearchConsoleDomainOnboard } from "../../domainOnboarding/googleSearchConsoleDomainOnboard.js"
import { googleSearchConsoleCliCloudflareApiTokenResolve } from "../googleSearchConsoleCliCloudflareApiTokenResolve.js"
import { googleSearchConsoleCliCommandExecute } from "../googleSearchConsoleCliCommandExecute.js"
import type { GoogleSearchConsoleCliFlags } from "../googleSearchConsoleCliFlags.js"
import { googleSearchConsoleCliOptions } from "../googleSearchConsoleCliOptions.js"
import { googleSearchConsoleCliResultWrite } from "../googleSearchConsoleCliResultWrite.js"
import type { GoogleSearchConsoleCommandContext } from "../googleSearchConsoleCommandContext.js"

export const siteOnboardCommand = buildCommand<
  GoogleSearchConsoleCliFlags,
  [domain: string],
  GoogleSearchConsoleCommandContext
>({
  func: async function (flags, domain) {
    const tokenResult = await googleSearchConsoleCliCloudflareApiTokenResolve(this.process.env ?? {}, flags.envFile)
    if (!tokenResult.success) {
      googleSearchConsoleCliResultWrite(this.process, tokenResult)
      return
    }

    return googleSearchConsoleCliCommandExecute(this, {
      clientInput: flags,
      execute: (client) =>
        googleSearchConsoleDomainOnboard(client, domain, {
          cloudflareApiToken: tokenResult.data,
        }),
      op: "googleSearchConsoleDomainOnboard",
    })
  },
  parameters: {
    flags: googleSearchConsoleCliOptions,
    positional: {
      kind: "tuple",
      parameters: [
        {
          brief: "Domain to verify and add to Search Console",
          placeholder: "domain",
          parse: (input) => input,
        },
      ],
    },
  },
  docs: {
    brief: "Onboard a domain with Cloudflare DNS verification",
  },
})
