import { describe, expect, it } from "bun:test"
import {
  googleSearchConsoleClientCreate,
  searchAnalyticsQuery,
  sitemapsList,
  sitesList,
  urlInspectionIndexInspect,
} from "../src/index.js"

const oauthConfig = {
  clientId: "client-id",
  clientSecret: "client-secret",
  refreshToken: "refresh-token",
}

describe("googleSearchConsoleClient", () => {
  const clientCreate = (config: Parameters<typeof googleSearchConsoleClientCreate>[0]) => {
    const result = googleSearchConsoleClientCreate(config)
    if (!result.success) throw new Error(result.errorMessage)
    return result.data
  }

  it("creates a client instance correctly", () => {
    const client = clientCreate({
      accessToken: "test-token",
    })
    expect(client.config.accessToken).toBe("test-token")
    expect(client.config.baseUrl).toBe("https://searchconsole.googleapis.com/webmasters/v3")
  })

  it("lists sites successfully with mocked fetch", async () => {
    const mockFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      expect(input.toString()).toBe("https://searchconsole.googleapis.com/webmasters/v3/sites")
      const headers = new Headers(init?.headers)
      expect(headers.get("Authorization")).toBe("Bearer test-token")
      expect(headers.get("Accept")).toBe("application/json")
      return new Response(
        JSON.stringify({
          siteEntry: [{ siteUrl: "https://example.com/", permissionLevel: "siteOwner" }],
        }),
        { status: 200 },
      )
    }

    const client = clientCreate({
      accessToken: "test-token",
      fetch: mockFetch,
    })

    const res = await sitesList(client)
    expect(res.success).toBe(true)
    if (res.success) {
      expect(res.data.siteEntry?.length).toBe(1)
      expect(res.data.siteEntry?.[0]?.siteUrl).toBe("https://example.com/")
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

    const client = clientCreate({
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

    const client = clientCreate({
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

    const client = clientCreate({
      accessToken: "test-token",
      fetch: mockFetch,
    })

    const res = await sitesList(client)
    expect(res.success).toBe(false)
    if (!res.success) {
      expect(res.op).toBe("sitesList")
      expect(res.errorMessage).toBe("Unauthorized")
    }
  })

  it("redacts OAuth access tokens from structured API errors", async () => {
    const returnedAccessToken = "oauth-structured-token"
    const client = clientCreate({
      oauth: oauthConfig,
      fetch: async (input) => {
        if (input.toString() === "https://oauth2.googleapis.com/token") {
          return new Response(JSON.stringify({ access_token: returnedAccessToken, expires_in: 3600 }), { status: 200 })
        }
        return new Response(
          JSON.stringify({
            error: {
              code: 403,
              message: `Permission denied for ${returnedAccessToken} ${oauthConfig.clientSecret} ${oauthConfig.refreshToken}`,
              status: "PERMISSION_DENIED",
              errors: [{ reason: "forbidden", message: `Bearer ${returnedAccessToken} ${oauthConfig.clientSecret}` }],
              details: {
                accessToken: returnedAccessToken,
                clientSecret: oauthConfig.clientSecret,
                refreshToken: oauthConfig.refreshToken,
                requestId: "request-id",
              },
            },
          }),
          { status: 403, statusText: `Forbidden ${oauthConfig.clientSecret}` },
        )
      },
    })

    const result = await sitesList(client)

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.code).toBe("PERMISSION_DENIED")
      expect(result.statusCode).toBe(403)
      expect(result.errorMessage).toBe("Permission denied for [REDACTED] [REDACTED] [REDACTED]")
      expect(result.errorData).toContain('"reason":"forbidden"')
      const errorData = JSON.parse(result.errorData ?? "{}")
      expect(errorData.error.details.accessToken).toBe("[REDACTED]")
      expect(errorData.error.details.clientSecret).toBe("[REDACTED]")
      expect(errorData.error.details.refreshToken).toBe("[REDACTED]")
      expect(errorData.error.details.requestId).toBe("request-id")
      expect(JSON.stringify(result)).not.toContain(returnedAccessToken)
      expect(JSON.stringify(result)).not.toContain(oauthConfig.clientSecret)
      expect(JSON.stringify(result)).not.toContain(oauthConfig.refreshToken)
    }
  })

  it("refreshes an OAuth token once and retries a 401 request", async () => {
    let tokenRequestCount = 0
    let apiRequestCount = 0
    const authorizationHeaders: string[] = []
    const client = clientCreate({
      oauth: oauthConfig,
      fetch: async (input, init) => {
        if (input.toString() === "https://oauth2.googleapis.com/token") {
          tokenRequestCount += 1
          return new Response(JSON.stringify({ access_token: `oauth-token-${tokenRequestCount}`, expires_in: 3600 }), {
            status: 200,
          })
        }

        apiRequestCount += 1
        authorizationHeaders.push(new Headers(init?.headers).get("Authorization") ?? "")
        if (apiRequestCount === 1) return new Response("Unauthorized", { status: 401, statusText: "Unauthorized" })
        return new Response(
          JSON.stringify({ siteEntry: [{ siteUrl: "https://example.com/", permissionLevel: "siteOwner" }] }),
          { status: 200 },
        )
      },
    })

    const result = await sitesList(client)

    expect(result.success).toBe(true)
    expect(tokenRequestCount).toBe(2)
    expect(apiRequestCount).toBe(2)
    expect(authorizationHeaders).toEqual(["Bearer oauth-token-1", "Bearer oauth-token-2"])
  })

  it("redacts unstructured OAuth errors and does not retry more than once after a 401", async () => {
    let tokenRequestCount = 0
    let apiRequestCount = 0
    const client = clientCreate({
      oauth: oauthConfig,
      fetch: async (input) => {
        if (input.toString() === "https://oauth2.googleapis.com/token") {
          tokenRequestCount += 1
          return new Response(JSON.stringify({ access_token: `oauth-token-${tokenRequestCount}`, expires_in: 3600 }), {
            status: 200,
          })
        }

        apiRequestCount += 1
        return new Response(
          `Unauthorized ${oauthConfig.clientSecret} ${oauthConfig.refreshToken} Bearer oauth-token-1 Bearer oauth-token-2`,
          {
            status: 401,
            statusText: `Unauthorized ${oauthConfig.clientSecret} ${oauthConfig.refreshToken}`,
          },
        )
      },
    })

    const result = await sitesList(client)

    expect(result.success).toBe(false)
    expect(tokenRequestCount).toBe(2)
    expect(apiRequestCount).toBe(2)
    if (!result.success) {
      expect(result.errorMessage).toBe("Unauthorized [REDACTED] [REDACTED]")
      expect(result.errorData).toContain("[REDACTED]")
      expect(JSON.stringify(result)).not.toContain("oauth-token-1")
      expect(JSON.stringify(result)).not.toContain("oauth-token-2")
      expect(JSON.stringify(result)).not.toContain(oauthConfig.clientSecret)
      expect(JSON.stringify(result)).not.toContain(oauthConfig.refreshToken)
    }
  })

  it("preserves the caller operation and safe errors when OAuth refresh fails", async () => {
    const returnedAccessToken = "returned-access-token"
    const client = clientCreate({
      oauth: oauthConfig,
      fetch: async (input) => {
        expect(input.toString()).toBe("https://oauth2.googleapis.com/token")
        return new Response(
          `token endpoint rejected ${oauthConfig.clientSecret} ${oauthConfig.refreshToken} ${returnedAccessToken}`,
          { status: 400, statusText: "Bad Request" },
        )
      },
    })

    const result = await sitesList(client)

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.op).toBe("sitesList")
      expect(result.errorMessage).toBe("OAuth token request failed")
      expect(JSON.stringify(result)).not.toContain(oauthConfig.clientSecret)
      expect(JSON.stringify(result)).not.toContain(oauthConfig.refreshToken)
      expect(JSON.stringify(result)).not.toContain(returnedAccessToken)
    }
  })

  it("preserves the caller operation when OAuth refresh fails after a 401", async () => {
    let tokenRequestCount = 0
    const returnedAccessToken = "oauth-token-1"
    const client = clientCreate({
      oauth: oauthConfig,
      fetch: async (input) => {
        if (input.toString() === "https://oauth2.googleapis.com/token") {
          tokenRequestCount += 1
          if (tokenRequestCount === 1) {
            return new Response(JSON.stringify({ access_token: returnedAccessToken, expires_in: 3600 }), {
              status: 200,
            })
          }
          return new Response(`refresh failed ${oauthConfig.clientSecret} ${oauthConfig.refreshToken}`, { status: 400 })
        }
        return new Response("Unauthorized", { status: 401, statusText: "Unauthorized" })
      },
    })

    const result = await sitesList(client)

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.op).toBe("sitesList")
      expect(result.errorMessage).toBe("OAuth token request failed")
      expect(JSON.stringify(result)).not.toContain(oauthConfig.clientSecret)
      expect(JSON.stringify(result)).not.toContain(oauthConfig.refreshToken)
      expect(JSON.stringify(result)).not.toContain(returnedAccessToken)
    }
  })

  it("bypasses OAuth refresh and retry when a static token is configured", async () => {
    let tokenRequestCount = 0
    let apiRequestCount = 0
    const authorizationHeaders: string[] = []
    const client = clientCreate({
      accessToken: "static-token",
      oauth: oauthConfig,
      fetch: async (input, init) => {
        if (input.toString() === "https://oauth2.googleapis.com/token") {
          tokenRequestCount += 1
          return new Response(JSON.stringify({ access_token: "unexpected-token", expires_in: 3600 }), { status: 200 })
        }

        apiRequestCount += 1
        authorizationHeaders.push(new Headers(init?.headers).get("Authorization") ?? "")
        return new Response("Unauthorized", { status: 401, statusText: "Unauthorized" })
      },
    })

    const result = await sitesList(client)

    expect(result.success).toBe(false)
    expect(tokenRequestCount).toBe(0)
    expect(apiRequestCount).toBe(1)
    expect(authorizationHeaders).toEqual(["Bearer static-token"])
  })
})
