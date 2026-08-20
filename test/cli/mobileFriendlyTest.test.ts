import { describe, expect, it } from "bun:test"
import { mobileFriendlyTestRouteMap } from "../../src/cli/mobileFriendlyTest/mobileFriendlyTestRouteMap.js"

describe("Mobile-Friendly Testing CLI commands", () => {
  it("exposes a run route", () => {
    expect(mobileFriendlyTestRouteMap.getAllEntries().map((entry) => entry.name.original)).toEqual(["run"])
  })
})
