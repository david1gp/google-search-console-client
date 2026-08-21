import { buildRouteMap, type RouteMap } from "@stricli/core"
import type { GoogleSearchConsoleCommandContext } from "../googleSearchConsoleCommandContext.js"
import { googleSearchConsoleOAuthLoginCommand } from "./googleSearchConsoleOAuthLoginCommand.js"

export const googleSearchConsoleOAuthRouteMap: RouteMap<GoogleSearchConsoleCommandContext> = buildRouteMap({
  routes: {
    login: googleSearchConsoleOAuthLoginCommand,
  },
  docs: {
    brief: "Manage Search Console authorization",
  },
})
