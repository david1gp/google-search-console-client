import { describe, expect, it } from "bun:test"
import * as v from "valibot"
import {
  googleSearchConsoleApiErrorResponseSchema,
  googleSearchConsoleBase64Schema,
  googleSearchConsoleClientCreate,
  googleSearchConsoleDateSchema,
  googleSearchConsoleDatetimeSchema,
  googleSearchConsoleRequest,
  googleSearchConsoleSiteUrlSchema,
} from "../../src/index.js"

const responseSchema = v.object({ ok: v.boolean() })

describe("google search console shared client", () => {
  it("returns a ResultErr for invalid configuration", () => {
    const result = googleSearchConsoleClientCreate({ accessToken: "" })

    expect(result.success).toBe(false)
    if (!result.success) expect(result.errorMessage).toContain("Invalid length")
  })

  it("uses the Search Console host and webmasters route by default", async () => {
    let requestUrl = ""
    const clientResult = googleSearchConsoleClientCreate({
      accessToken: "token",
      fetch: async (input) => {
        requestUrl = input.toString()
        return new Response(JSON.stringify({ ok: true }), { status: 200 })
      },
    })

    expect(clientResult.success).toBe(true)
    if (!clientResult.success) return

    const result = await googleSearchConsoleRequest(clientResult.data, {
      op: "sharedTest",
      path: "/sites",
      schema: responseSchema,
    })

    expect(result.success).toBe(true)
    expect(requestUrl).toBe("https://searchconsole.googleapis.com/webmasters/v3/sites")
  })

  it("preserves structured Google API errors in ResultErr", async () => {
    const clientResult = googleSearchConsoleClientCreate({
      accessToken: "token",
      fetch: async () =>
        new Response(
          JSON.stringify({
            error: {
              code: 403,
              message: "The caller does not have permission.",
              status: "PERMISSION_DENIED",
              errors: [{ reason: "forbidden" }],
            },
          }),
          { status: 403, statusText: "Forbidden" },
        ),
    })

    expect(clientResult.success).toBe(true)
    if (!clientResult.success) return

    const result = await googleSearchConsoleRequest(clientResult.data, {
      op: "sharedErrorTest",
      path: "/sites",
      schema: responseSchema,
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.code).toBe("PERMISSION_DENIED")
      expect(result.statusCode).toBe(403)
      expect(result.errorMessage).toBe("The caller does not have permission.")
      expect(JSON.parse(result.errorData ?? "{}").error.errors[0].reason).toBe("forbidden")
    }
  })

  it("uses the mobile-friendly API key without sending a bearer token", async () => {
    let requestUrl = ""
    let requestHeaders: Headers | undefined
    const clientResult = googleSearchConsoleClientCreate({
      mobileFriendlyApiKey: "api-key",
      fetch: async (input, init) => {
        requestUrl = input.toString()
        requestHeaders = new Headers(init?.headers)
        return new Response(JSON.stringify({ ok: true }), { status: 200 })
      },
    })

    expect(clientResult.success).toBe(true)
    if (!clientResult.success) return

    const result = await googleSearchConsoleRequest(clientResult.data, {
      op: "mobileFriendlyTest",
      baseUrl: "https://searchconsole.googleapis.com/v1",
      path: "/urlTestingTools/mobileFriendlyTest:run",
      auth: "mobileFriendlyApiKey",
      schema: responseSchema,
    })

    expect(result.success).toBe(true)
    expect(requestUrl).toBe(
      "https://searchconsole.googleapis.com/v1/urlTestingTools/mobileFriendlyTest:run?key=api-key",
    )
    expect(requestHeaders?.has("Authorization")).toBe(false)
  })

  it("validates shared Search Console values", () => {
    expect(v.safeParse(googleSearchConsoleDateSchema, "2026-02-29").success).toBe(false)
    expect(v.safeParse(googleSearchConsoleDateSchema, "2026-08-20").success).toBe(true)
    expect(v.safeParse(googleSearchConsoleDatetimeSchema, "2026-08-20T12:00:00.123Z").success).toBe(true)
    expect(v.safeParse(googleSearchConsoleDatetimeSchema, "2026-02-30T12:00:00Z").success).toBe(false)
    expect(v.safeParse(googleSearchConsoleDatetimeSchema, "2026-08-20").success).toBe(false)
    expect(v.safeParse(googleSearchConsoleBase64Schema, "aGVsbG8=").success).toBe(true)
    expect(v.safeParse(googleSearchConsoleBase64Schema, "not-base64!").success).toBe(false)
    expect(v.safeParse(googleSearchConsoleSiteUrlSchema, "sc-domain:example.com").success).toBe(true)
    expect(v.safeParse(googleSearchConsoleSiteUrlSchema, "not-a-site").success).toBe(false)
    expect(
      v.safeParse(googleSearchConsoleApiErrorResponseSchema, { error: { code: 400, message: "Bad request" } }).success,
    ).toBe(true)
  })
})
