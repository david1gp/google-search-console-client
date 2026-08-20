import { describe, expect, it } from "bun:test"
import * as v from "valibot"
import { googleSearchConsoleClientCreate } from "../../src/googleSearchConsoleClientCreate.js"
import type { GoogleSearchConsoleFetch } from "../../src/shared/googleSearchConsoleFetch.js"
import { urlInspectionIndexInspect } from "../../src/urlInspection/indexInspect/urlInspectionIndexInspect.js"
import { urlInspectionIndexInspectRequestSchema } from "../../src/urlInspection/schemas/urlInspectionIndexInspectRequestSchema.js"
import { urlInspectionIndexInspectResponseSchema } from "../../src/urlInspection/schemas/urlInspectionIndexInspectResponseSchema.js"

describe("URL Inspection endpoint", () => {
  const clientCreate = (fetch: GoogleSearchConsoleFetch) => {
    const result = googleSearchConsoleClientCreate({
      accessToken: "test-token",
      fetch,
    })
    if (!result.success) throw new Error(result.errorMessage)
    return result.data
  }

  it("validates the current discovery request and response schemas", () => {
    const request = {
      inspectionUrl: "https://example.com/page",
      siteUrl: "sc-domain:example.com",
      languageCode: "en-US",
    } as const

    expect(v.safeParse(urlInspectionIndexInspectRequestSchema, request).success).toBe(true)
    expect(
      v.safeParse(urlInspectionIndexInspectRequestSchema, { ...request, inspectionUrl: "not-a-url" }).success,
    ).toBe(false)

    const response = v.safeParse(urlInspectionIndexInspectResponseSchema, {
      inspectionResult: {
        inspectionResultLink:
          "https://search.google.com/search-console/inspect?resource_id=https%3A%2F%2Fexample.com%2F",
        indexStatusResult: {
          verdict: "PASS",
          coverageState: "Submitted and indexed",
          robotsTxtState: "ALLOWED",
          indexingState: "INDEXING_ALLOWED",
          lastCrawlTime: "2026-08-19T12:00:00Z",
          pageFetchState: "SUCCESSFUL",
          googleCanonical: "https://example.com/page",
          userCanonical: "https://example.com/page",
          crawledAs: "MOBILE",
          sitemap: ["https://example.com/sitemap.xml"],
          referringUrls: ["https://example.com/"],
        },
        ampResult: {
          pageFetchState: "SUCCESSFUL",
          robotsTxtState: "ALLOWED",
          indexingState: "AMP_INDEXING_ALLOWED",
          lastCrawlTime: "2026-08-19T12:00:00Z",
          issues: [{ severity: "WARNING", issueMessage: "An AMP warning" }],
          verdict: "PASS",
          ampIndexStatusVerdict: "PASS",
          ampUrl: "https://example.com/page/amp",
        },
        richResultsResult: {
          detectedItems: [{ richResultType: "Article", items: [{ name: "Article", issues: [] }] }],
          verdict: "PASS",
        },
        mobileUsabilityResult: {
          verdict: "PASS",
          issues: [
            {
              message: "A mobile usability issue",
              severity: "WARNING",
              issueType: "CONFIGURE_VIEWPORT",
            },
          ],
        },
      },
    })
    expect(response.success).toBe(true)
    expect(
      v.safeParse(urlInspectionIndexInspectResponseSchema, {
        inspectionResult: { indexStatusResult: { lastCrawlTime: "2026-02-30T12:00:00Z" } },
      }).success,
    ).toBe(false)
    expect(
      v.safeParse(urlInspectionIndexInspectResponseSchema, {
        inspectionResult: { indexStatusResult: { indexingState: "INDEXED" } },
      }).success,
    ).toBe(false)
  })

  it("inspects a URL through the v1 endpoint", async () => {
    const client = clientCreate(async (input, init) => {
      expect(input.toString()).toBe("https://searchconsole.googleapis.com/v1/urlInspection/index:inspect")
      expect(init?.method).toBe("POST")
      expect(new Headers(init?.headers).get("Authorization")).toBe("Bearer test-token")
      expect(JSON.parse(init?.body as string)).toEqual({
        inspectionUrl: "https://example.com/page",
        siteUrl: "https://example.com/",
        languageCode: "en-US",
      })
      return new Response(JSON.stringify({ inspectionResult: { indexStatusResult: { verdict: "PASS" } } }))
    })

    const result = await urlInspectionIndexInspect(client, {
      inspectionUrl: "https://example.com/page",
      siteUrl: "https://example.com/",
      languageCode: "en-US",
    })

    expect(result.success).toBe(true)
    if (result.success) expect(result.data.inspectionResult?.indexStatusResult?.verdict).toBe("PASS")
  })

  it("returns validation errors without fetching", async () => {
    let fetchCalled = false
    const client = clientCreate(async () => {
      fetchCalled = true
      return new Response(null, { status: 204 })
    })

    const result = await urlInspectionIndexInspect(client, {
      inspectionUrl: "not-a-url",
      siteUrl: "https://example.com/",
    })
    expect(result.success).toBe(false)
    expect(fetchCalled).toBe(false)
    if (!result.success) expect(result.op).toBe("urlInspectionIndexInspect")
  })
})
