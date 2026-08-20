import { describe, expect, it } from "bun:test"
import type { StricliProcess } from "@stricli/core"
import { googleSearchConsoleCliApplication, googleSearchConsoleCliRun } from "../../src/cli/index.js"
import { searchAnalyticsRouteMap } from "../../src/cli/searchAnalytics/searchAnalyticsRouteMap.js"

describe("Search Analytics CLI commands", () => {
  it("exposes a query route", () => {
    expect(searchAnalyticsRouteMap.getAllEntries().map((entry) => entry.name.original)).toEqual(["query"])
  })

  it("marks search-type as a deprecated alias for type in help", async () => {
    const result = await googleSearchConsoleCliRunResult(["search-analytics", "query", "--help"])

    expect(result.exitCode).toBe(0)
    expect(result.stderr).toBe("")
    expect(JSON.parse(result.stdout)).toEqual({
      success: true,
      data: expect.stringContaining("Deprecated alias for --type"),
    })
  })

  it("emits only canonical type when search-type is used alone", async () => {
    let requestBody: unknown
    const server = Bun.serve({
      port: 0,
      async fetch(request) {
        requestBody = await request.json()
        return Response.json({ rows: [], responseAggregationType: "byPage" })
      },
    })

    try {
      const result = await googleSearchConsoleCliRunResult([
        "search-analytics",
        "query",
        "https://example.com/",
        "2026-08-01",
        "2026-08-02",
        "--access-token",
        "test-token",
        "--base-url",
        `http://127.0.0.1:${server.port}`,
        "--dimensions",
        "query,page",
        "--search-type",
        "web",
        "--aggregation-type",
        "byPage",
        "--data-state",
        "final",
      ])

      expect(result.exitCode).toBe(0)
      expect(result.stderr).toBe("")
      expect(JSON.parse(result.stdout)).toEqual({
        success: true,
        data: { rows: [], responseAggregationType: "byPage" },
      })
      expect(requestBody).toEqual({
        startDate: "2026-08-01",
        endDate: "2026-08-02",
        dimensions: ["query", "page"],
        type: "web",
        aggregationType: "byPage",
        dataState: "final",
      })
    } finally {
      server.stop()
    }
  })

  it("rejects conflicting type and search-type before fetching", async () => {
    let fetchCount = 0
    const server = Bun.serve({
      port: 0,
      fetch() {
        fetchCount += 1
        return Response.json({ rows: [], responseAggregationType: "byPage" })
      },
    })

    try {
      const result = await googleSearchConsoleCliRunResult([
        "search-analytics",
        "query",
        "https://example.com/",
        "2026-08-01",
        "2026-08-02",
        "--access-token",
        "test-token",
        "--base-url",
        `http://127.0.0.1:${server.port}`,
        "--type",
        "web",
        "--search-type",
        "discover",
      ])

      expect(result.exitCode).toBe(1)
      expect(result.stdout).toBe("")
      expect(JSON.parse(result.stderr)).toMatchObject({
        success: false,
        op: "searchAnalyticsQuery",
        errorMessage: expect.stringContaining("type and searchType must match"),
      })
      expect(fetchCount).toBe(0)
    } finally {
      server.stop()
    }
  })
})

async function googleSearchConsoleCliRunResult(inputs: readonly string[]): Promise<{
  readonly exitCode: number | string | null | undefined
  readonly stderr: string
  readonly stdout: string
}> {
  const output = { stderr: "", stdout: "" }
  const process: StricliProcess = {
    env: {},
    exitCode: undefined,
    stderr: { write: (value) => (output.stderr += value) },
    stdout: { write: (value) => (output.stdout += value) },
  }
  await googleSearchConsoleCliRun(googleSearchConsoleCliApplication, inputs, process)
  return { exitCode: process.exitCode, stderr: output.stderr.trim(), stdout: output.stdout.trim() }
}
