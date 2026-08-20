import { describe, expect, it } from "bun:test"
import * as v from "valibot"
import { googleSearchConsoleClientCreate } from "../../src/googleSearchConsoleClientCreate.js"
import { mobileFriendlyTestRun } from "../../src/mobileFriendlyTest/run/mobileFriendlyTestRun.js"
import { mobileFriendlyTestRunRequestSchema } from "../../src/mobileFriendlyTest/schemas/mobileFriendlyTestRunRequestSchema.js"
import { mobileFriendlyTestRunResponseSchema } from "../../src/mobileFriendlyTest/schemas/mobileFriendlyTestRunResponseSchema.js"
import type { GoogleSearchConsoleFetch } from "../../src/shared/googleSearchConsoleFetch.js"

describe("Mobile-Friendly Testing endpoint", () => {
  const clientCreate = (fetch: GoogleSearchConsoleFetch) => {
    const result = googleSearchConsoleClientCreate({
      accessToken: "oauth-token",
      mobileFriendlyApiKey: "api-key",
      fetch,
    })
    if (!result.success) throw new Error(result.errorMessage)
    return result.data
  }

  it("validates the current discovery request and response schemas", () => {
    const request = {
      url: "https://example.com/page",
      requestScreenshot: true,
    } as const

    expect(v.safeParse(mobileFriendlyTestRunRequestSchema, request).success).toBe(true)
    expect(v.safeParse(mobileFriendlyTestRunRequestSchema, { ...request, url: "not-a-url" }).success).toBe(false)

    const response = v.safeParse(mobileFriendlyTestRunResponseSchema, {
      screenshot: { mimeType: "image/png", data: "aGVsbG8=" },
      mobileFriendliness: "NOT_MOBILE_FRIENDLY",
      resourceIssues: [{ blockedResource: { url: "https://example.com/style.css" } }],
      testStatus: { status: "COMPLETE", details: "The inspection completed." },
      mobileFriendlyIssues: [{ rule: "CONFIGURE_VIEWPORT" }],
    })
    expect(response.success).toBe(true)
    expect(
      v.safeParse(mobileFriendlyTestRunResponseSchema, {
        screenshot: { data: "not-base64!" },
      }).success,
    ).toBe(false)
    expect(
      v.safeParse(mobileFriendlyTestRunResponseSchema, {
        mobileFriendliness: "UNKNOWN",
      }).success,
    ).toBe(false)
  })

  it("runs through the v1 endpoint with the Mobile-Friendly API key", async () => {
    const client = clientCreate(async (input, init) => {
      expect(input.toString()).toBe(
        "https://searchconsole.googleapis.com/v1/urlTestingTools/mobileFriendlyTest:run?key=api-key",
      )
      expect(init?.method).toBe("POST")
      const headers = new Headers(init?.headers)
      expect(headers.get("Authorization")).toBe(null)
      expect(headers.get("Content-Type")).toBe("application/json")
      expect(JSON.parse(init?.body as string)).toEqual({
        url: "https://example.com/page",
        requestScreenshot: true,
      })
      return new Response(
        JSON.stringify({
          testStatus: { status: "COMPLETE" },
          mobileFriendliness: "MOBILE_FRIENDLY",
          screenshot: { mimeType: "image/png", data: "aGVsbG8=" },
        }),
      )
    })

    const result = await mobileFriendlyTestRun(client, {
      url: "https://example.com/page",
      requestScreenshot: true,
    })

    expect(result.success).toBe(true)
    if (result.success) expect(result.data.mobileFriendliness).toBe("MOBILE_FRIENDLY")
  })

  it("runs through the v1 endpoint with an OAuth bearer token when no API key is configured", async () => {
    const clientResult = googleSearchConsoleClientCreate({
      accessToken: "oauth-token",
      fetch: async (input, init) => {
        expect(input.toString()).toBe("https://searchconsole.googleapis.com/v1/urlTestingTools/mobileFriendlyTest:run")
        expect(new Headers(init?.headers).get("Authorization")).toBe("Bearer oauth-token")
        expect(input.toString()).not.toContain("key=")
        return new Response(JSON.stringify({ testStatus: { status: "COMPLETE" } }))
      },
    })
    expect(clientResult.success).toBe(true)
    if (!clientResult.success) return

    const result = await mobileFriendlyTestRun(clientResult.data, { url: "https://example.com/page" })
    expect(result.success).toBe(true)
  })

  it("returns validation errors without fetching", async () => {
    let fetchCalled = false
    const client = clientCreate(async () => {
      fetchCalled = true
      return new Response(null, { status: 204 })
    })

    const result = await mobileFriendlyTestRun(client, { url: "not-a-url" })
    expect(result.success).toBe(false)
    expect(fetchCalled).toBe(false)
    if (!result.success) expect(result.op).toBe("mobileFriendlyTestRun")
  })
})
