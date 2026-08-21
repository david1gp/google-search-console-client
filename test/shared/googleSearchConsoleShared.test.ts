import { describe, expect, it } from "bun:test"
import * as v from "valibot"
import {
  googleSearchConsoleApiErrorResponseSchema,
  googleSearchConsoleBase64Schema,
  googleSearchConsoleClientCreate,
  googleSearchConsoleDateSchema,
  googleSearchConsoleDatetimeSchema,
  googleSearchConsoleOAuthTokenResolve,
  googleSearchConsoleRequest,
  googleSearchConsoleSiteUrlSchema,
} from "../../src/index.js"

const responseSchema = v.object({ ok: v.boolean() })
const oauthConfig = {
  clientId: "client-id",
  clientSecret: "client-secret",
  refreshToken: "refresh-token",
}

describe("google search console shared client", () => {
  it("returns a ResultErr for invalid configuration", () => {
    const result = googleSearchConsoleClientCreate({ accessToken: "" })

    expect(result.success).toBe(false)
    if (!result.success) expect(result.errorMessage).toContain("Invalid length")
  })

  it("validates OAuth configuration and defaults the token URL", () => {
    const validResult = googleSearchConsoleClientCreate({ oauth: oauthConfig })

    expect(validResult.success).toBe(true)
    if (validResult.success) {
      expect(validResult.data.config.oauth).toEqual({
        ...oauthConfig,
        tokenUrl: "https://oauth2.googleapis.com/token",
      })
    }

    const customUrlResult = googleSearchConsoleClientCreate({
      oauth: { ...oauthConfig, tokenUrl: "https://oauth.example.com/token" },
    })

    expect(customUrlResult.success).toBe(true)
    if (customUrlResult.success)
      expect(customUrlResult.data.config.oauth?.tokenUrl).toBe("https://oauth.example.com/token")

    const invalidResult = googleSearchConsoleClientCreate({
      oauth: { ...oauthConfig, clientSecret: "" },
    })

    expect(invalidResult.success).toBe(false)
    if (!invalidResult.success) expect(invalidResult.errorMessage).toContain("Invalid length")
  })

  it("sends OAuth refresh credentials as a form-encoded request", async () => {
    let requestUrl = ""
    let requestInit: RequestInit | undefined
    const clientResult = googleSearchConsoleClientCreate({
      oauth: oauthConfig,
      fetch: async (input, init) => {
        requestUrl = input.toString()
        requestInit = init
        return new Response(JSON.stringify({ access_token: "access-token", expires_in: 3600 }), { status: 200 })
      },
    })

    expect(clientResult.success).toBe(true)
    if (!clientResult.success) return

    const result = await googleSearchConsoleOAuthTokenResolve(clientResult.data)

    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data).toBe("access-token")
    expect(requestUrl).toBe("https://oauth2.googleapis.com/token")
    expect(requestInit?.method).toBe("POST")
    const headers = new Headers(requestInit?.headers)
    expect(headers.get("Accept")).toBe("application/json")
    expect(headers.get("Content-Type")).toBe("application/x-www-form-urlencoded")
    expect(Object.fromEntries(new URLSearchParams(String(requestInit?.body)))).toEqual({
      client_id: oauthConfig.clientId,
      client_secret: oauthConfig.clientSecret,
      grant_type: "refresh_token",
      refresh_token: oauthConfig.refreshToken,
    })
  })

  it("omits an optional OAuth client secret from refresh requests", async () => {
    let requestInit: RequestInit | undefined
    const clientResult = googleSearchConsoleClientCreate({
      oauth: {
        clientId: oauthConfig.clientId,
        refreshToken: oauthConfig.refreshToken,
      },
      fetch: async (_input, init) => {
        requestInit = init
        return new Response(JSON.stringify({ access_token: "access-token", expires_in: 3600 }), { status: 200 })
      },
    })

    expect(clientResult.success).toBe(true)
    if (!clientResult.success) return

    const result = await googleSearchConsoleOAuthTokenResolve(clientResult.data)

    expect(result.success).toBe(true)
    expect(Object.fromEntries(new URLSearchParams(String(requestInit?.body)))).toEqual({
      client_id: oauthConfig.clientId,
      grant_type: "refresh_token",
      refresh_token: oauthConfig.refreshToken,
    })
  })

  it("reuses cached tokens and refreshes near-expiry tokens", async () => {
    let refreshCount = 0
    const clientResult = googleSearchConsoleClientCreate({
      oauth: oauthConfig,
      fetch: async () => {
        refreshCount += 1
        return new Response(JSON.stringify({ access_token: `access-token-${refreshCount}`, expires_in: 3600 }), {
          status: 200,
        })
      },
    })

    expect(clientResult.success).toBe(true)
    if (!clientResult.success) return

    const firstResult = await googleSearchConsoleOAuthTokenResolve(clientResult.data)
    const cachedResult = await googleSearchConsoleOAuthTokenResolve(clientResult.data)

    expect(firstResult.success).toBe(true)
    expect(cachedResult.success).toBe(true)
    if (!firstResult.success || !cachedResult.success) return
    expect(firstResult.data).toBe("access-token-1")
    expect(cachedResult.data).toBe("access-token-1")
    expect(refreshCount).toBe(1)

    clientResult.data.oauthTokenCache!.expiresAt = Date.now() + 59_000
    const nearExpiryResult = await googleSearchConsoleOAuthTokenResolve(clientResult.data)

    expect(nearExpiryResult.success).toBe(true)
    if (!nearExpiryResult.success) return
    expect(nearExpiryResult.data).toBe("access-token-2")
    expect(refreshCount).toBe(2)
  })

  it("deduplicates concurrent OAuth refreshes", async () => {
    let refreshCount = 0
    let releaseTokenResponse: ((response: Response) => void) | undefined
    const clientResult = googleSearchConsoleClientCreate({
      oauth: oauthConfig,
      fetch: async () => {
        refreshCount += 1
        return new Promise<Response>((resolve) => {
          releaseTokenResponse = resolve
        })
      },
    })

    expect(clientResult.success).toBe(true)
    if (!clientResult.success) return

    const firstPromise = googleSearchConsoleOAuthTokenResolve(clientResult.data)
    const secondPromise = googleSearchConsoleOAuthTokenResolve(clientResult.data)
    expect(refreshCount).toBe(1)
    if (releaseTokenResponse === undefined) throw new Error("OAuth refresh was not started")
    releaseTokenResponse(
      new Response(JSON.stringify({ access_token: "shared-token", expires_in: 3600 }), { status: 200 }),
    )

    const [firstResult, secondResult] = await Promise.all([firstPromise, secondPromise])

    expect(firstResult.success).toBe(true)
    expect(secondResult.success).toBe(true)
    if (!firstResult.success || !secondResult.success) return
    expect(firstResult.data).toBe("shared-token")
    expect(secondResult.data).toBe("shared-token")
  })

  it("returns safe network, HTTP, and malformed OAuth response errors", async () => {
    const networkClientResult = googleSearchConsoleClientCreate({
      oauth: oauthConfig,
      fetch: async () => {
        throw new Error(`network failure ${oauthConfig.clientSecret} ${oauthConfig.refreshToken}`)
      },
    })
    expect(networkClientResult.success).toBe(true)
    if (!networkClientResult.success) return

    const networkResult = await googleSearchConsoleOAuthTokenResolve(networkClientResult.data)

    expect(networkResult.success).toBe(false)
    if (!networkResult.success) {
      expect(networkResult.errorMessage).toBe("OAuth token request failed")
      expect(JSON.stringify(networkResult)).not.toContain(oauthConfig.clientSecret)
      expect(JSON.stringify(networkResult)).not.toContain(oauthConfig.refreshToken)
    }

    const httpClientResult = googleSearchConsoleClientCreate({
      oauth: oauthConfig,
      fetch: async () =>
        new Response(`token endpoint rejected ${oauthConfig.refreshToken}`, {
          status: 400,
          statusText: "Bad Request",
        }),
    })
    expect(httpClientResult.success).toBe(true)
    if (!httpClientResult.success) return

    const httpResult = await googleSearchConsoleOAuthTokenResolve(httpClientResult.data)

    expect(httpResult.success).toBe(false)
    if (!httpResult.success) {
      expect(httpResult.errorMessage).toBe("OAuth token request failed")
      expect(httpResult.statusCode).toBe(400)
      expect(JSON.stringify(httpResult)).not.toContain(oauthConfig.refreshToken)
    }

    const malformedClientResult = googleSearchConsoleClientCreate({
      oauth: oauthConfig,
      fetch: async () =>
        new Response(JSON.stringify({ access_token: oauthConfig.refreshToken, expires_in: "not-a-number" }), {
          status: 200,
        }),
    })
    expect(malformedClientResult.success).toBe(true)
    if (!malformedClientResult.success) return

    const malformedResult = await googleSearchConsoleOAuthTokenResolve(malformedClientResult.data)

    expect(malformedResult.success).toBe(false)
    if (!malformedResult.success) {
      expect(malformedResult.errorMessage).toBe("Invalid OAuth token response")
      expect(JSON.stringify(malformedResult)).not.toContain(oauthConfig.refreshToken)
    }
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
    let tokenRequestCount = 0
    const clientResult = googleSearchConsoleClientCreate({
      accessToken: "static-token",
      mobileFriendlyApiKey: "api-key",
      oauth: oauthConfig,
      fetch: async (input, init) => {
        requestUrl = input.toString()
        requestHeaders = new Headers(init?.headers)
        if (requestUrl === "https://oauth2.googleapis.com/token") tokenRequestCount += 1
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
    expect(tokenRequestCount).toBe(0)
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
