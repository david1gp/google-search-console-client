import { buildRouteMap, type RouteMap } from "@stricli/core"
import type { GoogleSearchConsoleCommandContext } from "../googleSearchConsoleCommandContext.js"
import { searchAnalyticsQueryCommand } from "./searchAnalyticsQueryCommand.js"

export const searchAnalyticsRouteMap: RouteMap<GoogleSearchConsoleCommandContext> = buildRouteMap({
  routes: {
    query: searchAnalyticsQueryCommand,
  },
  docs: {
    brief: "Query Search Console Search Analytics",
  },
})
