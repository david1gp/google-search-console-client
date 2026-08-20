import { describe, expect, it } from "bun:test"
import * as root from "@adaptive-ds/google-search-console-client"
import * as mobileFriendlyTest from "@adaptive-ds/google-search-console-client/mobileFriendlyTest"
import * as searchAnalytics from "@adaptive-ds/google-search-console-client/searchAnalytics"
import * as sitemaps from "@adaptive-ds/google-search-console-client/sitemaps"
import * as sites from "@adaptive-ds/google-search-console-client/sites"
import * as urlInspection from "@adaptive-ds/google-search-console-client/urlInspection"

describe("package endpoint exports", () => {
  it("resolves each bare endpoint import to its emitted module", () => {
    expect(typeof root.packageVersion).toBe("string")
    expect(typeof sites.sitesList).toBe("function")
    expect(typeof sitemaps.sitemapsList).toBe("function")
    expect(typeof searchAnalytics.searchAnalyticsQuery).toBe("function")
    expect(typeof urlInspection.urlInspectionIndexInspect).toBe("function")
    expect(typeof mobileFriendlyTest.mobileFriendlyTestRun).toBe("function")
  })
})
