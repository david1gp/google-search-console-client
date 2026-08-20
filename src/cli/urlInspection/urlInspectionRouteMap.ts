import { buildRouteMap, type RouteMap } from "@stricli/core"
import type { GoogleSearchConsoleCommandContext } from "../googleSearchConsoleCommandContext.js"
import { urlInspectionIndexInspectCommand } from "./urlInspectionIndexInspectCommand.js"

export const urlInspectionRouteMap: RouteMap<GoogleSearchConsoleCommandContext> = buildRouteMap({
  routes: {
    inspect: urlInspectionIndexInspectCommand,
  },
  docs: {
    brief: "Inspect URLs with Search Console",
  },
})
