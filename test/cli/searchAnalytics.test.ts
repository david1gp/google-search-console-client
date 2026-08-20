import { describe, expect, it } from "bun:test"
import type { StricliProcess } from "@stricli/core"
import { googleSearchConsoleCliApplication, googleSearchConsoleCliRun } from "../../src/cli/index.js"
import { searchAnalyticsRouteMap } from "../../src/cli/searchAnalytics/searchAnalyticsRouteMap.js"

describe("Search Analytics CLI commands", () => {
  it("exposes a query route", () => {
    expect(searchAnalyticsRouteMap.getAllEntries().map((entry) => entry.name.original)).toEqual(["query"])
  })

  it("accepts the Google JSON aggregation enum casing", async () => {
    let requestBody: unknown
    const server = Bun.serve({
      port: 0,
      async fetch(request) {
        requestBody = await request.json()
        return Response.json({ rows: [], responseAggregationType: "BY_PAGE" })
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
        "--aggregation-type",
        "BY_PAGE",
      ])

      expect(result.exitCode).toBe(0)
      expect(result.stderr).toBe("")
      expect(JSON.parse(result.stdout)).toEqual({
        success: true,
        data: { rows: [], responseAggregationType: "BY_PAGE" },
      })
      expect(requestBody).toEqual({
        startDate: "2026-08-01",
        endDate: "2026-08-02",
        aggregationType: "BY_PAGE",
      })
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
