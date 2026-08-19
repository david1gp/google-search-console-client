import { describe, expect, it } from "bun:test"
import {
  googleSearchConsoleClientCreate,
  searchAnalyticsQuery,
  sitemapGet,
  sitemapsList,
  sitemapSubmit,
  sitesList,
  urlInspectionIndexInspect,
} from "../src/index.js"

describe("googleSearchConsoleClient", () => {
  it("creates a client instance correctly", () => {
    const client = googleSearchConsoleClientCreate({
      accessToken: "test-token",
    })
    expect(client.config.accessToken).toBe("test-token")
    expect(client.config.baseUrl).toBe("https://www.googleapis.com/webmasters/v3")
  })

  it("lists sites successfully with mocked fetch", async () => {
    const mockFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      expect(input.toString()).toBe("https://www.googleapis.com/webmasters/v3/sites")
      expect(init?.headers).toEqual({
        Authorization: "Bearer test-token",
        Accept: "application/json",
      })
      return new Response(
        JSON.stringify({
          siteEntry: [{ siteUrl: "https://example.com/", permissionLevel: "siteOwner" }],
        }),
        { status: 200 },
      )
    }

    const client = googleSearchConsoleClientCreate({
      accessToken: "test-token",
      fetch: mockFetch,
    })

    const res = await sitesList(client)
    expect(res.success).toBe(true)
    if (res.success) {
      expect(res.data.siteEntry.length).toBe(1)
      expect(res.data.siteEntry[0]?.siteUrl).toBe("https://example.com/")
    }
  })

  it("queries search analytics successfully", async () => {
    const mockFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      expect(input.toString()).toContain("/sites/https%3A%2F%2Fexample.com%2F/searchAnalytics/query")
      const parsedBody = JSON.parse(init?.body as string)
      expect(parsedBody.startDate).toBe("2026-08-01")
      return new Response(
        JSON.stringify({
          rows: [
            {
              keys: ["test query"],
              clicks: 42,
              impressions: 100,
              ctr: 0.42,
              position: 2.1,
            },
          ],
        }),
        { status: 200 },
      )
    }

    const client = googleSearchConsoleClientCreate({
      accessToken: "test-token",
      fetch: mockFetch,
    })

    const res = await searchAnalyticsQuery(client, {
      siteUrl: "https://example.com/",
      startDate: "2026-08-01",
      endDate: "2026-08-15",
      dimensions: ["query"],
    })

    expect(res.success).toBe(true)
    if (res.success) {
      expect(res.data.rows?.length).toBe(1)
      expect(res.data.rows?.[0]?.clicks).toBe(42)
    }
  })

  it("handles sitemap list and inspect", async () => {
    const mockFetch = async (input: RequestInfo | URL) => {
      const urlStr = input.toString()
      if (urlStr.includes("/sitemaps")) {
        return new Response(
          JSON.stringify({
            sitemap: [{ path: "https://example.com/sitemap.xml", isPending: false }],
          }),
          { status: 200 },
        )
      }
      return new Response(
        JSON.stringify({
          inspectionResult: {
            inspectionUrl: "https://example.com/page",
            indexStatusResult: { verdict: "PASS", coverageState: "Submitted and indexed" },
          },
        }),
        { status: 200 },
      )
    }

    const client = googleSearchConsoleClientCreate({
      accessToken: "test-token",
      fetch: mockFetch,
    })

    const sitemapsRes = await sitemapsList(client, "https://example.com/")
    expect(sitemapsRes.success).toBe(true)

    const inspectRes = await urlInspectionIndexInspect(client, {
      inspectionUrl: "https://example.com/page",
      siteUrl: "https://example.com/",
    })
    expect(inspectRes.success).toBe(true)
    if (inspectRes.success) {
      expect(inspectRes.data.inspectionResult?.indexStatusResult?.verdict).toBe("PASS")
    }
  })

  it("handles fetch errors gracefully via ResultErr", async () => {
    const mockFetch = async () => {
      return new Response("Unauthorized", { status: 401, statusText: "Unauthorized" })
    }

    const client = googleSearchConsoleClientCreate({
      accessToken: "test-token",
      fetch: mockFetch,
    })

    const res = await sitesList(client)
    expect(res.success).toBe(false)
    if (!res.success) {
      expect(res.op).toBe("sitesList")
      expect(res.errorMessage).toContain("401")
    }
  })
})
