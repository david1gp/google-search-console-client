import { describe, expect, it } from "bun:test"
import { urlInspectionRouteMap } from "../../src/cli/urlInspection/urlInspectionRouteMap.js"

describe("URL Inspection CLI commands", () => {
  it("exposes an inspect route", () => {
    expect(urlInspectionRouteMap.getAllEntries().map((entry) => entry.name.original)).toEqual(["inspect"])
  })
})
