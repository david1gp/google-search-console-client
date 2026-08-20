import { describe, expect, it } from "bun:test"
import { sitemapsRouteMap } from "../../src/cli/sitemaps/sitemapsRouteMap.js"

describe("Sitemaps CLI commands", () => {
  it("exposes composable list, get, submit, and delete routes", () => {
    expect(sitemapsRouteMap.getAllEntries().map((entry) => entry.name.original)).toEqual([
      "list",
      "get",
      "submit",
      "delete",
    ])
  })
})
