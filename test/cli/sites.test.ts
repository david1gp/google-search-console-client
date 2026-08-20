import { describe, expect, it } from "bun:test"
import { sitesRouteMap } from "../../src/cli/sites/sitesRouteMap.js"

describe("Sites CLI commands", () => {
  it("exposes composable list, get, add, and delete routes", () => {
    expect(sitesRouteMap.getAllEntries().map((entry) => entry.name.original)).toEqual(["list", "get", "add", "delete"])
  })
})
