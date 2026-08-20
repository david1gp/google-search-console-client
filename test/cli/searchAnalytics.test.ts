import { describe, expect, it } from "bun:test"
import { searchAnalyticsRouteMap } from "../../src/cli/searchAnalytics/searchAnalyticsRouteMap.js"

describe("Search Analytics CLI commands", () => {
  it("exposes a query route", () => {
    expect(searchAnalyticsRouteMap.getAllEntries().map((entry) => entry.name.original)).toEqual(["query"])
  })
})
