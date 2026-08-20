import { describe, expect, it } from "bun:test"
import * as v from "valibot"
import { googleSearchConsoleClientCreate } from "../../src/googleSearchConsoleClientCreate.js"
import { searchAnalyticsQuery } from "../../src/searchAnalytics/query/searchAnalyticsQuery.js"
import { searchAnalyticsDimensionFilterGroupSchema } from "../../src/searchAnalytics/schemas/searchAnalyticsDimensionFilterGroupSchema.js"
import { searchAnalyticsDimensionFilterSchema } from "../../src/searchAnalytics/schemas/searchAnalyticsDimensionFilterSchema.js"
import { searchAnalyticsMetadataSchema } from "../../src/searchAnalytics/schemas/searchAnalyticsMetadataSchema.js"
import { searchAnalyticsQueryRequestSchema } from "../../src/searchAnalytics/schemas/searchAnalyticsQueryRequestSchema.js"
import { searchAnalyticsQueryResponseSchema } from "../../src/searchAnalytics/schemas/searchAnalyticsQueryResponseSchema.js"
import type { GoogleSearchConsoleFetch } from "../../src/shared/googleSearchConsoleFetch.js"

describe("Search Analytics endpoint", () => {
  const discoverGoogleNewsRow = { keys: ["shoes"], clicks: 12, impressions: 240, ctr: 0.05 } as const

  const clientCreate = (fetch: GoogleSearchConsoleFetch) => {
    const result = googleSearchConsoleClientCreate({
      accessToken: "test-token",
      fetch,
    })
    if (!result.success) throw new Error(result.errorMessage)
    return result.data
  }

  it("validates Search Analytics request and response schemas", () => {
    const baseRequest = {
      siteUrl: "https://example.com/",
      startDate: "2026-08-01",
      endDate: "2026-08-15",
    } as const
    const request = {
      ...baseRequest,
      dimensions: ["date", "query", "page", "country", "device", "searchAppearance", "hour"],
      type: "web",
      searchType: "web",
      dimensionFilterGroups: [
        {
          groupType: "and",
          filters: [{ dimension: "query", operator: "includingRegex", expression: "buy" }],
        },
      ],
      aggregationType: "byPage",
      startRow: 100,
      rowLimit: 25000,
      dataState: "hourly_all",
    } as const

    const parsedRequest = v.safeParse(searchAnalyticsQueryRequestSchema, request)
    expect(parsedRequest.success).toBe(true)
    if (parsedRequest.success) {
      expect(parsedRequest.output.type).toBe("web")
      expect("searchType" in parsedRequest.output).toBe(false)
    }
    const parsedSearchTypeOnlyRequest = v.safeParse(searchAnalyticsQueryRequestSchema, {
      ...baseRequest,
      searchType: "image",
    })
    expect(parsedSearchTypeOnlyRequest.success).toBe(true)
    if (parsedSearchTypeOnlyRequest.success) {
      expect(parsedSearchTypeOnlyRequest.output).toEqual({ ...baseRequest, type: "image" })
    }
    const parsedWithoutTypeRequest = v.safeParse(searchAnalyticsQueryRequestSchema, baseRequest)
    expect(parsedWithoutTypeRequest.success).toBe(true)
    if (parsedWithoutTypeRequest.success) expect("type" in parsedWithoutTypeRequest.output).toBe(false)
    expect(
      v.safeParse(searchAnalyticsQueryRequestSchema, { ...baseRequest, type: "web", searchType: "discover" }).success,
    ).toBe(false)
    expect(
      v.safeParse(searchAnalyticsDimensionFilterSchema, {
        dimension: "page",
        operator: "notEquals",
        expression: "https://example.com/",
      }).success,
    ).toBe(true)
    const officialSampleGroup = v.safeParse(searchAnalyticsDimensionFilterGroupSchema, {
      filters: [{ dimension: "query", expression: "shoes" }],
    })
    expect(officialSampleGroup.success).toBe(true)
    if (officialSampleGroup.success) {
      expect(officialSampleGroup.output).toEqual({ filters: [{ dimension: "query", expression: "shoes" }] })
    }
    expect(v.safeParse(searchAnalyticsDimensionFilterGroupSchema, {}).success).toBe(true)
    expect(v.safeParse(searchAnalyticsDimensionFilterGroupSchema, { groupType: "and" }).success).toBe(true)
    expect(v.safeParse(searchAnalyticsDimensionFilterGroupSchema, { filters: [] }).success).toBe(true)
    expect(v.safeParse(searchAnalyticsQueryRequestSchema, { ...request, endDate: "2026-07-31" }).success).toBe(false)
    expect(v.safeParse(searchAnalyticsQueryRequestSchema, { ...request, startDate: "2026/08/01" }).success).toBe(false)
    expect(v.safeParse(searchAnalyticsQueryRequestSchema, { ...request, startDate: "2026-02-30" }).success).toBe(false)
    expect(v.safeParse(searchAnalyticsQueryRequestSchema, { ...request, dimensions: ["query", "query"] }).success).toBe(
      false,
    )
    expect(v.safeParse(searchAnalyticsQueryRequestSchema, { ...request, startRow: 0 }).success).toBe(true)
    expect(v.safeParse(searchAnalyticsQueryRequestSchema, { ...request, rowLimit: 1 }).success).toBe(true)
    expect(v.safeParse(searchAnalyticsQueryRequestSchema, { ...request, rowLimit: 0 }).success).toBe(false)
    expect(v.safeParse(searchAnalyticsQueryRequestSchema, { ...request, rowLimit: 25001 }).success).toBe(false)
    expect(v.safeParse(searchAnalyticsQueryRequestSchema, { ...request, startRow: -1 }).success).toBe(false)
    expect(v.safeParse(searchAnalyticsQueryRequestSchema, { ...request, startRow: 1.5 }).success).toBe(false)
    expect(v.safeParse(searchAnalyticsQueryRequestSchema, { ...request, unknownRequestField: true }).success).toBe(
      false,
    )
    expect(
      v.safeParse(searchAnalyticsDimensionFilterSchema, {
        dimension: "query",
        expression: "shoes",
        unknownFilterField: true,
      }).success,
    ).toBe(false)
    expect(
      v.safeParse(searchAnalyticsDimensionFilterSchema, {
        dimension: "query",
        operator: "contains",
        expression: "x".repeat(4096),
      }).success,
    ).toBe(true)
    expect(
      v.safeParse(searchAnalyticsDimensionFilterSchema, {
        dimension: "query",
        operator: "contains",
        expression: "x".repeat(4097),
      }).success,
    ).toBe(false)
    expect(
      v.safeParse(searchAnalyticsDimensionFilterGroupSchema, {
        groupType: "and",
        filters: [{ dimension: "query", operator: "contains", expression: "shoes" }],
        unknownGroupField: true,
      }).success,
    ).toBe(false)
    expect(
      v.safeParse(searchAnalyticsDimensionFilterGroupSchema, {
        groupType: "or",
        filters: [],
      }).success,
    ).toBe(false)
    expect(
      v.safeParse(searchAnalyticsDimensionFilterSchema, {
        dimension: "date",
        operator: "equals",
        expression: "2026-08-01",
      }).success,
    ).toBe(false)

    const response = v.safeParse(searchAnalyticsQueryResponseSchema, {
      rows: [
        {
          keys: ["query"],
          clicks: 3,
          impressions: 10,
          ctr: 0.3,
          position: 2.5,
          unknownRowField: "preserved",
        },
      ],
      responseAggregationType: "byPage",
      metadata: {
        firstIncompleteDate: "2026-08-14",
        firstIncompleteHour: "2026-08-14T12:00:00-07:00",
        unknownMetadataField: true,
      },
      unknownResponseField: { preserved: true },
    })
    expect(response.success).toBe(true)
    if (response.success) {
      expect(response.output.rows?.[0]?.clicks).toBe(3)
      expect(response.output.rows?.[0]?.unknownRowField).toBe("preserved")
      expect(response.output.responseAggregationType).toBe("byPage")
      expect(response.output.metadata?.firstIncompleteDate).toBe("2026-08-14")
      expect(response.output.metadata?.unknownMetadataField).toBe(true)
      expect(response.output.unknownResponseField).toEqual({ preserved: true })
    }
    const emptyResponse = v.safeParse(searchAnalyticsQueryResponseSchema, {})
    expect(emptyResponse.success).toBe(true)
    if (emptyResponse.success) expect(emptyResponse.output).toEqual({})
    expect(
      v.safeParse(searchAnalyticsQueryResponseSchema, {
        rows: [{ clicks: 0, impressions: 0, ctr: 0, position: 0 }],
      }).success,
    ).toBe(true)
    expect(v.safeParse(searchAnalyticsQueryResponseSchema, { responseAggregationType: "UNKNOWN" }).success).toBe(false)
    expect(v.safeParse(searchAnalyticsQueryResponseSchema, { responseAggregationType: "BY_PAGE" }).success).toBe(false)
    expect(v.safeParse(searchAnalyticsQueryRequestSchema, { ...request, aggregationType: "BY_PAGE" }).success).toBe(
      false,
    )
  })

  it("requires finite metrics and bounds CTR to the supported range", () => {
    const row = { clicks: 3, impressions: 10, ctr: 0.3, position: 2.5 }
    for (const metric of ["clicks", "impressions", "ctr"] as const) {
      const rowWithoutMetric = Object.fromEntries(Object.entries(row).filter(([key]) => key !== metric))
      expect(v.safeParse(searchAnalyticsQueryResponseSchema, { rows: [rowWithoutMetric] }).success).toBe(false)
      expect(
        v.safeParse(searchAnalyticsQueryResponseSchema, { rows: [{ ...row, [metric]: Number.POSITIVE_INFINITY }] })
          .success,
      ).toBe(false)
    }

    expect(v.safeParse(searchAnalyticsQueryResponseSchema, { rows: [discoverGoogleNewsRow] }).success).toBe(true)
    expect(
      v.safeParse(searchAnalyticsQueryResponseSchema, {
        rows: [{ ...discoverGoogleNewsRow, position: Number.POSITIVE_INFINITY }],
      }).success,
    ).toBe(false)

    expect(v.safeParse(searchAnalyticsQueryResponseSchema, { rows: [{ ...row, ctr: -0.01 }] }).success).toBe(false)
    expect(v.safeParse(searchAnalyticsQueryResponseSchema, { rows: [{ ...row, ctr: 1.01 }] }).success).toBe(false)
    expect(v.safeParse(searchAnalyticsQueryResponseSchema, { rows: [{ ...row, ctr: 0 }] }).success).toBe(true)
    expect(v.safeParse(searchAnalyticsQueryResponseSchema, { rows: [{ ...row, ctr: 1 }] }).success).toBe(true)
  })

  it("validates metadata date-times as RFC 3339", () => {
    expect(
      v.safeParse(searchAnalyticsMetadataSchema, { firstIncompleteHour: "2026-08-14 12:00:00.123Z" }).success,
    ).toBe(false)
    expect(
      v.safeParse(searchAnalyticsMetadataSchema, { firstIncompleteHour: "2026-08-14T12:00:00.123456Z" }).success,
    ).toBe(true)
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
        dimensions: ["query"],
        type: "web",
        dimensionFilterGroups: [
          {
            groupType: "and",
            filters: [{ dimension: "query", operator: "contains", expression: "buy" }],
          },
        ],
        aggregationType: "auto",
        startRow: 10,
        rowLimit: 100,
        dataState: "final",
      })
      return new Response(
        JSON.stringify({ rows: [{ keys: ["buy shoes"], clicks: 3, impressions: 10, ctr: 0.3, position: 2.5 }] }),
      )
    })

    const result = await searchAnalyticsQuery(client, {
      siteUrl,
      startDate: "2026-08-01",
      endDate: "2026-08-15",
      dimensions: ["query"],
      searchType: "web",
      dimensionFilterGroups: [
        {
          groupType: "and",
          filters: [{ dimension: "query", operator: "contains", expression: "buy" }],
        },
      ],
      aggregationType: "auto",
      startRow: 10,
      rowLimit: 100,
      dataState: "final",
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

  it("rejects conflicting search type inputs without fetching", async () => {
    let fetchCalled = false
    const client = clientCreate(async () => {
      fetchCalled = true
      return new Response(JSON.stringify({}))
    })

    const result = await searchAnalyticsQuery(client, {
      siteUrl: "https://example.com/",
      startDate: "2026-08-01",
      endDate: "2026-08-15",
      type: "web",
      searchType: "discover",
    })
    expect(result.success).toBe(false)
    expect(fetchCalled).toBe(false)
    if (!result.success) expect(result.op).toBe("searchAnalyticsQuery")
  })
})
