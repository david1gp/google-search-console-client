import { buildRouteMap, type RouteMap } from "@stricli/core"
import type { GoogleSearchConsoleCommandContext } from "../googleSearchConsoleCommandContext.js"
import { mobileFriendlyTestRunCommand } from "./mobileFriendlyTestRunCommand.js"

export const mobileFriendlyTestRouteMap: RouteMap<GoogleSearchConsoleCommandContext> = buildRouteMap({
  routes: {
    run: mobileFriendlyTestRunCommand,
  },
  docs: {
    brief: "Run Mobile-Friendly Tests",
  },
})
