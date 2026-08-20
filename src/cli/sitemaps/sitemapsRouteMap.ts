import { buildRouteMap, type RouteMap } from "@stricli/core"
import type { GoogleSearchConsoleCommandContext } from "../googleSearchConsoleCommandContext.js"
import { sitemapDeleteCommand } from "./sitemapDeleteCommand.js"
import { sitemapGetCommand } from "./sitemapGetCommand.js"
import { sitemapSubmitCommand } from "./sitemapSubmitCommand.js"
import { sitemapsListCommand } from "./sitemapsListCommand.js"

export const sitemapsRouteMap: RouteMap<GoogleSearchConsoleCommandContext> = buildRouteMap({
  routes: {
    list: sitemapsListCommand,
    get: sitemapGetCommand,
    submit: sitemapSubmitCommand,
    delete: sitemapDeleteCommand,
  },
  docs: {
    brief: "Manage Search Console sitemaps",
  },
})
