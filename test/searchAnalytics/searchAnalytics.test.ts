import { describe, expect, it } from "bun:test"
import * as v from "valibot"
import { googleSearchConsoleClientCreate } from "../../src/googleSearchConsoleClientCreate.js"
import { searchAnalyticsQuery } from "../../src/searchAnalytics/query/searchAnalyticsQuery.js"
import { searchAnalyticsDimensionFilterGroupSchema } from "../../src/searchAnalytics/schemas/searchAnalyticsDimensionFilterGroupSchema.js"
import { searchAnalyticsDimensionFilterSchema } from "../../src/searchAnalytics/schemas/searchAnalyticsDimensionFilterSchema.js"
import { searchAnalyticsQueryRequestSchema } from "../../src/searchAnalytics/schemas/searchAnalyticsQueryRequestSchema.js"
import { searchAnalyticsQueryResponseSchema } from "../../src/searchAnalytics/schemas/searchAnalyticsQueryResponseSchema.js"
import type { GoogleSearchConsoleFetch } from "../../src/shared/googleSearchConsoleFetch.js"

describe("Search Analytics endpoint", () => {
  const clientCreate = (fetch: GoogleSearchConsoleFetch) => {
    const result = googleSearchConsoleClientCreate({
      accessToken: "test-token",
      fetch,
    })
    if (!result.success) throw new Error(result.errorMessage)
    return result.data
  }

  it("validates current discovery request and response schemas", () => {
    const request = {
      siteUrl: "https://example.com/",
      startDate: "2026-08-01",
      endDate: "2026-08-15",
      dimensions: ["DATE", "QUERY", "PAGE", "COUNTRY", "DEVICE", "SEARCH_APPEARANCE", "HOUR"],
      type: "WEB",
      searchType: "GOOGLE_NEWS",
      dimensionFilterGroups: [
        {
          groupType: "AND",
          filters: [{ dimension: "QUERY", operator: "INCLUDING_REGEX", expression: "buy" }],
        },
      ],
      aggregationType: "BY_PAGE",
      startRow: 100,
      rowLimit: 25000,
      dataState: "HOURLY_ALL",
    } as const

    expect(v.safeParse(searchAnalyticsQueryRequestSchema, request).success).toBe(true)
    expect(
      v.safeParse(searchAnalyticsDimensionFilterSchema, {
        dimension: "PAGE",
        operator: "NOT_EQUALS",
        expression: "https://example.com/",
      }).success,
    ).toBe(true)
    const emptyGroup = v.safeParse(searchAnalyticsDimensionFilterGroupSchema, {})
    expect(emptyGroup.success).toBe(true)
    if (emptyGroup.success) expect(emptyGroup.output).toEqual({})
    expect(v.safeParse(searchAnalyticsQueryRequestSchema, { ...request, endDate: "2026-07-31" }).success).toBe(false)
    expect(v.safeParse(searchAnalyticsQueryRequestSchema, { ...request, rowLimit: 0 }).success).toBe(false)
    expect(v.safeParse(searchAnalyticsQueryRequestSchema, { ...request, rowLimit: 25001 }).success).toBe(false)
    expect(v.safeParse(searchAnalyticsQueryRequestSchema, { ...request, startRow: -1 }).success).toBe(false)
    expect(
      v.safeParse(searchAnalyticsDimensionFilterSchema, {
        dimension: "DATE",
        operator: "EQUALS",
        expression: "2026-08-01",
      }).success,
    ).toBe(false)

    const response = v.safeParse(searchAnalyticsQueryResponseSchema, {
      rows: [{ keys: ["query"] }],
      responseAggregationType: "BY_PAGE",
      metadata: {
        firstIncompleteDate: "2026-08-14",
        firstIncompleteHour: "2026-08-14T12:00:00-07:00",
      },
    })
    expect(response.success).toBe(true)
    if (response.success) {
      expect(response.output.rows?.[0]?.clicks).toBeUndefined()
      expect(response.output.metadata?.firstIncompleteDate).toBe("2026-08-14")
    }
    const emptyResponse = v.safeParse(searchAnalyticsQueryResponseSchema, {})
    expect(emptyResponse.success).toBe(true)
    if (emptyResponse.success) expect(emptyResponse.output).toEqual({})
    expect(v.safeParse(searchAnalyticsQueryResponseSchema, { responseAggregationType: "UNKNOWN" }).success).toBe(false)
    expect(v.safeParse(searchAnalyticsQueryResponseSchema, { responseAggregationType: "byPage" }).success).toBe(false)
    expect(v.safeParse(searchAnalyticsQueryRequestSchema, { ...request, aggregationType: "byPage" }).success).toBe(
      false,
    )
  })

  it("queries Search Analytics with encoded site and pagination inputs", async () => {
    const siteUrl = "https://example.com/!/'()*?x=1#fragment"
    const client = clientCreate(async (input, init) => {
      expect(input.toString()).toBe(
        "https://searchconsole.googleapis.com/webmasters/v3/sites/https%3A%2F%2Fexample.com%2F%21%2F%27%28%29%2A%3Fx%3D1%23fragment/searchAnalytics/query",
      )
      expect(init?.method).toBe("POST")
      expect(new Headers(init?.headers).get("Authorization")).toBe("Bearer test-token")
      expect(JSON.parse(init?.body as string)).toEqual({
        startDate: "2026-08-01",
        endDate: "2026-08-15",
        dimensions: ["QUERY"],
        type: "WEB",
        searchType: "WEB",
        dimensionFilterGroups: [
          {
            groupType: "AND",
            filters: [{ dimension: "QUERY", operator: "CONTAINS", expression: "buy" }],
          },
        ],
        aggregationType: "AUTO",
        startRow: 10,
        rowLimit: 100,
        dataState: "FINAL",
      })
      return new Response(JSON.stringify({ rows: [{ keys: ["buy shoes"], clicks: 3 }] }))
    })

    const result = await searchAnalyticsQuery(client, {
      siteUrl,
      startDate: "2026-08-01",
      endDate: "2026-08-15",
      dimensions: ["QUERY"],
      type: "WEB",
      searchType: "WEB",
      dimensionFilterGroups: [
        {
          groupType: "AND",
          filters: [{ dimension: "QUERY", operator: "CONTAINS", expression: "buy" }],
        },
      ],
      aggregationType: "AUTO",
      startRow: 10,
      rowLimit: 100,
      dataState: "FINAL",
    })

    expect(result.success).toBe(true)
    if (result.success) expect(result.data.rows?.[0]?.clicks).toBe(3)
  })

  it("does not materialize omitted optional request fields", async () => {
    const client = clientCreate(async (input, init) => {
      expect(input.toString()).toBe(
        "https://searchconsole.googleapis.com/webmasters/v3/sites/https%3A%2F%2Fexample.com%2F/searchAnalytics/query",
      )
      expect(JSON.parse(init?.body as string)).toEqual({
        startDate: "2026-08-01",
        endDate: "2026-08-15",
      })
      return new Response(JSON.stringify({}))
    })

    const result = await searchAnalyticsQuery(client, {
      siteUrl: "https://example.com/",
      startDate: "2026-08-01",
      endDate: "2026-08-15",
    })

    expect(result.success).toBe(true)
  })

  it("returns validation errors without fetching", async () => {
    let fetchCalled = false
    const client = clientCreate(async () => {
      fetchCalled = true
      return new Response(null, { status: 204 })
    })

    const result = await searchAnalyticsQuery(client, {
      siteUrl: "not-a-site",
      startDate: "2026-08-15",
      endDate: "2026-08-01",
    })
    expect(result.success).toBe(false)
    expect(fetchCalled).toBe(false)
    if (!result.success) expect(result.op).toBe("searchAnalyticsQuery")
  })
})
