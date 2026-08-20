import { buildRouteMap, type RouteMap } from "@stricli/core"
import type { GoogleSearchConsoleCommandContext } from "../googleSearchConsoleCommandContext.js"
import { siteAddCommand } from "./siteAddCommand.js"
import { siteDeleteCommand } from "./siteDeleteCommand.js"
import { siteGetCommand } from "./siteGetCommand.js"
import { sitesListCommand } from "./sitesListCommand.js"

export const sitesRouteMap: RouteMap<GoogleSearchConsoleCommandContext> = buildRouteMap({
  routes: {
    list: sitesListCommand,
    get: siteGetCommand,
    add: siteAddCommand,
    delete: siteDeleteCommand,
  },
  docs: {
    brief: "Manage Search Console sites",
  },
})
