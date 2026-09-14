import { describe, expect, it } from "bun:test"
import { cloudflareDnsTxtEnsure } from "../../src/domainOnboarding/cloudflareDnsTxtEnsure.js"
import { cloudflareZoneFindByDomain } from "../../src/domainOnboarding/cloudflareZoneFindByDomain.js"
import { googleSearchConsoleDomainOnboard } from "../../src/domainOnboarding/googleSearchConsoleDomainOnboard.js"
import { googleSiteVerificationInsert } from "../../src/domainOnboarding/googleSiteVerificationInsert.js"
import { googleSiteVerificationTokenGet } from "../../src/domainOnboarding/googleSiteVerificationTokenGet.js"
import { googleSearchConsoleClientCreate } from "../../src/googleSearchConsoleClientCreate.js"
import type { GoogleSearchConsoleFetch } from "../../src/shared/googleSearchConsoleFetch.js"

describe("domain onboarding", () => {
  const clientCreate = (fetch: GoogleSearchConsoleFetch) => {
    const result = googleSearchConsoleClientCreate({ accessToken: "google-token", fetch })
    if (!result.success) throw new Error(result.errorMessage)
    return result.data
  }

  it("finds an active Cloudflare zone without sending Google credentials", async () => {
    const result = await cloudflareZoneFindByDomain("Example.COM", {
      apiToken: "cloudflare-token",
      baseUrl: "https://cloudflare.test/client/v4",
      fetch: async (input, init) => {
        expect(input.toString()).toBe("https://cloudflare.test/client/v4/zones?name=example.com&status=active")
        const headers = new Headers(init?.headers)
        expect(headers.get("Authorization")).toBe("Bearer cloudflare-token")
        expect(headers.get("Authorization")).not.toContain("google-token")
        return new Response(JSON.stringify({ success: true, result: [{ id: "zone-id", name: "example.com" }] }))
      },
    })

    expect(result).toEqual({ success: true, data: { id: "zone-id", name: "example.com" } })
  })

  it("preserves records and is idempotent when the exact TXT exists", async () => {
    const methods: string[] = []
    const result = await cloudflareDnsTxtEnsure("zone/id", {
      apiToken: "cloudflare-token",
      name: "example.com",
      content: "google-site-verification=exact",
      baseUrl: "https://cloudflare.test/client/v4",
      fetch: async (input, init) => {
        methods.push(`${init?.method}:${input.toString()}`)
        return new Response(
          JSON.stringify({
            success: true,
            result: [
              { id: "other", type: "TXT", name: "example.com", content: "other", ttl: 300 },
              { id: "exact", type: "TXT", name: "example.com", content: "google-site-verification=exact", ttl: 300 },
            ],
          }),
        )
      },
    })

    expect(result.success).toBe(true)
    if (result.success) expect(result.data.created).toBe(false)
    expect(methods).toHaveLength(1)
  })

  it("creates only the missing exact TXT record", async () => {
    const requests: Array<{ method: string; body?: unknown }> = []
    const result = await cloudflareDnsTxtEnsure("zone-id", {
      apiToken: "cloudflare-token",
      name: "example.com",
      content: "google-site-verification=new",
      ttl: 120,
      baseUrl: "https://cloudflare.test/client/v4",
      fetch: async (_input, init) => {
        requests.push({
          method: init?.method ?? "GET",
          body: init?.body === undefined ? undefined : JSON.parse(init.body as string),
        })
        if (init?.method === "POST") {
          return new Response(
            JSON.stringify({
              success: true,
              result: {
                id: "created",
                type: "TXT",
                name: "example.com",
                content: "google-site-verification=new",
                ttl: 120,
              },
            }),
          )
        }
        return new Response(JSON.stringify({ success: true, result: [] }))
      },
    })

    expect(result.success).toBe(true)
    expect(requests).toEqual([
      { method: "GET", body: undefined },
      {
        method: "POST",
        body: { type: "TXT", name: "example.com", content: "google-site-verification=new", ttl: 120 },
      },
    ])
  })

  it("gets and inserts DNS_TXT verification resources through the OAuth transport", async () => {
    const calls: Array<{ url: string; method: string; authorization: string | null; body?: unknown }> = []
    const client = clientCreate(async (input, init) => {
      calls.push({
        url: input.toString(),
        method: init?.method ?? "GET",
        authorization: new Headers(init?.headers).get("Authorization"),
        body: init?.body === undefined ? undefined : JSON.parse(init.body as string),
      })
      if (input.toString().endsWith("/token")) {
        return new Response(JSON.stringify({ method: "DNS_TXT", token: "google-site-verification=token" }))
      }
      return new Response(JSON.stringify({ id: "resource-id" }))
    })

    const tokenResult = await googleSiteVerificationTokenGet(client, "Example.COM", {
      baseUrl: "https://google.test/siteVerification/v1",
    })
    const insertResult = await googleSiteVerificationInsert(client, "example.com", {
      baseUrl: "https://google.test/siteVerification/v1",
    })

    expect(tokenResult.success).toBe(true)
    expect(insertResult.success).toBe(true)
    expect(calls).toEqual([
      {
        url: "https://google.test/siteVerification/v1/token",
        method: "POST",
        authorization: "Bearer google-token",
        body: { site: { identifier: "example.com", type: "INET_DOMAIN" }, verificationMethod: "DNS_TXT" },
      },
      {
        url: "https://google.test/siteVerification/v1/webResource?verificationMethod=DNS_TXT",
        method: "POST",
        authorization: "Bearer google-token",
        body: { site: { identifier: "example.com", type: "INET_DOMAIN" } },
      },
    ])
  })

  it("retries propagation, then adds the sc-domain property without leaking Google auth to Cloudflare", async () => {
    let verificationCalls = 0
    const googleCalls: string[] = []
    const cloudflareCalls: string[] = []
    const client = clientCreate(async (input, init) => {
      googleCalls.push(`${init?.method}:${input.toString()}`)
      const url = input.toString()
      if (url.endsWith("/token")) return new Response(JSON.stringify({ method: "DNS_TXT", token: "txt-token" }))
      if (url.includes("/webResource?")) {
        verificationCalls += 1
        if (verificationCalls === 1) return new Response("not propagated", { status: 400, statusText: "Bad Request" })
        return new Response(JSON.stringify({ id: "resource-id" }))
      }
      return new Response(null, { status: 204 })
    })
    const cloudflareFetch: GoogleSearchConsoleFetch = async (input, init) => {
      const headers = new Headers(init?.headers)
      expect(headers.get("Authorization")).toBe("Bearer cloudflare-token")
      expect(headers.get("Authorization")).not.toContain("google-token")
      cloudflareCalls.push(`${init?.method}:${input.toString()}`)
      if (init?.method === "POST") {
        return new Response(
          JSON.stringify({
            success: true,
            result: { id: "record-id", type: "TXT", name: "example.com", content: "txt-token", ttl: 1 },
          }),
        )
      }
      if (input.toString().includes("/zones?")) {
        return new Response(JSON.stringify({ success: true, result: [{ id: "zone-id", name: "example.com" }] }))
      }
      return new Response(JSON.stringify({ success: true, result: [] }))
    }

    const result = await googleSearchConsoleDomainOnboard(client, "example.com", {
      cloudflareApiToken: "cloudflare-token",
      cloudflareFetch,
      cloudflareBaseUrl: "https://cloudflare.test/client/v4",
      googleSiteVerificationBaseUrl: "https://google.test/siteVerification/v1",
      maxVerificationAttempts: 2,
      verificationRetryDelayMs: 0,
      sleep: async () => undefined,
    })

    expect(result).toEqual({
      success: true,
      data: {
        domain: "example.com",
        siteUrl: "sc-domain:example.com",
        txtRecordCreated: true,
        verificationAttempts: 2,
      },
    })
    expect(googleCalls).toEqual([
      "POST:https://google.test/siteVerification/v1/token",
      "POST:https://google.test/siteVerification/v1/webResource?verificationMethod=DNS_TXT",
      "POST:https://google.test/siteVerification/v1/webResource?verificationMethod=DNS_TXT",
      "PUT:https://searchconsole.googleapis.com/webmasters/v3/sites/sc-domain%3Aexample.com",
    ])
    expect(cloudflareCalls).toHaveLength(3)
  })

  it("returns a bounded verification error", async () => {
    let verificationCalls = 0
    const client = clientCreate(async (input) => {
      if (input.toString().endsWith("/token"))
        return new Response(JSON.stringify({ method: "DNS_TXT", token: "txt-token" }))
      verificationCalls += 1
      if (input.toString().includes("/webResource")) return new Response("not propagated", { status: 400 })
      return new Response(null, { status: 204 })
    })
    const result = await googleSearchConsoleDomainOnboard(client, "example.com", {
      cloudflareApiToken: "cloudflare-token",
      cloudflareBaseUrl: "https://cloudflare.test/client/v4",
      cloudflareFetch: async (input, init) => {
        if (input.toString().includes("/zones?"))
          return new Response(JSON.stringify({ success: true, result: [{ id: "zone-id", name: "example.com" }] }))
        if (init?.method === "POST") {
          return new Response(
            JSON.stringify({
              success: true,
              result: { id: "record-id", type: "TXT", name: "example.com", content: "txt-token", ttl: 1 },
            }),
          )
        }
        if (input.toString().includes("/dns_records"))
          return new Response(JSON.stringify({ success: true, result: [] }))
        return new Response(null, { status: 500 })
      },
      googleSiteVerificationBaseUrl: "https://google.test/siteVerification/v1",
      maxVerificationAttempts: 3,
      verificationRetryDelayMs: 0,
      sleep: async () => undefined,
    })

    expect(result.success).toBe(false)
    expect(verificationCalls).toBe(3)
    if (!result.success) expect(result.op).toBe("googleSearchConsoleDomainOnboard")
  })
})
