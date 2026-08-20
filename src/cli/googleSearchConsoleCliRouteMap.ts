import { buildRouteMap, type RouteMap } from "@stricli/core"
import type { GoogleSearchConsoleCommandContext } from "./googleSearchConsoleCommandContext.js"
import { mobileFriendlyTestRouteMap } from "./mobileFriendlyTest/mobileFriendlyTestRouteMap.js"
import { searchAnalyticsRouteMap } from "./searchAnalytics/searchAnalyticsRouteMap.js"
import { sitemapsRouteMap } from "./sitemaps/sitemapsRouteMap.js"
import { sitesRouteMap } from "./sites/sitesRouteMap.js"
import { urlInspectionRouteMap } from "./urlInspection/urlInspectionRouteMap.js"

export const googleSearchConsoleCliRouteMap: RouteMap<GoogleSearchConsoleCommandContext> = buildRouteMap({
  routes: {
    mobileFriendlyTest: mobileFriendlyTestRouteMap,
    searchAnalytics: searchAnalyticsRouteMap,
    sitemaps: sitemapsRouteMap,
    sites: sitesRouteMap,
    urlInspection: urlInspectionRouteMap,
  },
  docs: {
    brief: "Query and manage Google Search Console resources",
  },
})
