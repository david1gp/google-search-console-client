import { buildApplication, help, version } from "@stricli/core"
import { packageVersion } from "../packageVersion.js"
import { googleSearchConsoleCliApplicationText } from "./googleSearchConsoleCliApplicationText.js"
import { googleSearchConsoleCliRouteMap } from "./googleSearchConsoleCliRouteMap.js"
import type { GoogleSearchConsoleCommandContext } from "./googleSearchConsoleCommandContext.js"

export const googleSearchConsoleCliApplication = buildApplication<GoogleSearchConsoleCommandContext>(
  googleSearchConsoleCliRouteMap,
  {
    name: "google-search-console",
    scanner: {
      caseStyle: "allow-kebab-for-camel",
    },
    documentation: {
      disableAnsiColor: true,
    },
    determineExitCode: () => 1,
    localization: {
      text: googleSearchConsoleCliApplicationText,
    },
  },
  {
    help: help({
      brief: "Print help information and exit",
      formatting: {
        caseStyle: "convert-camel-to-kebab",
        onlyRequiredInUsageLine: false,
        useAliasInUsageLine: false,
      },
    }),
    version: version({
      brief: "Print version information and exit",
      info: {
        currentVersion: packageVersion,
      },
    }),
  },
)
