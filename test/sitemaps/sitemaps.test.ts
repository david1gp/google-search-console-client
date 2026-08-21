import { describe, expect, it } from "bun:test"
import * as v from "valibot"
import { googleSearchConsoleClientCreate } from "../../src/googleSearchConsoleClientCreate.js"
import type { GoogleSearchConsoleFetch } from "../../src/shared/googleSearchConsoleFetch.js"
import { sitemapDelete } from "../../src/sitemaps/delete/sitemapDelete.js"
import { sitemapGet } from "../../src/sitemaps/get/sitemapGet.js"
import { sitemapsList } from "../../src/sitemaps/list/sitemapsList.js"
import { sitemapContentSchema } from "../../src/sitemaps/schemas/sitemapContentSchema.js"
import { sitemapEntrySchema } from "../../src/sitemaps/schemas/sitemapEntrySchema.js"
import { sitemapsListResponseSchema } from "../../src/sitemaps/schemas/sitemapsListResponseSchema.js"
import { sitemapSubmit } from "../../src/sitemaps/submit/sitemapSubmit.js"

describe("Sitemaps endpoints", () => {
  const clientCreate = (fetch: GoogleSearchConsoleFetch) => {
    const result = googleSearchConsoleClientCreate({
      accessToken: "test-token",
      fetch,
    })
    if (!result.success) throw new Error(result.errorMessage)
    return result.data
  }

  it("accepts human-doc sitemap type spellings", () => {
    const sitemapTypes = ["notSitemap", "urlList", "sitemap", "rssFeed", "atomFeed", "patternSitemap"]
    const contentTypes = ["web", "image", "video", "news", "mobile", "androidApp", "pattern", "iosApp"]

    for (const type of sitemapTypes) {
      expect(v.safeParse(sitemapEntrySchema, { type }).success).toBe(true)
    }
    for (const type of contentTypes) {
      expect(v.safeParse(sitemapEntrySchema, { type: "sitemap", contents: [{ type }] }).success).toBe(true)
    }
  })

  it("accepts Discovery sitemap type spellings", () => {
    const sitemapTypes = [
      "NOT_SITEMAP",
      "URL_LIST",
      "SITEMAP",
      "RSS_FEED",
      "ATOM_FEED",
      "PATTERN_SITEMAP",
      "OCEANFRONT",
    ]
    const contentTypes = [
      "WEB",
      "IMAGE",
      "VIDEO",
      "NEWS",
      "MOBILE",
      "ANDROID_APP",
      "PATTERN",
      "IOS_APP",
      "DATA_FEED_ELEMENT",
    ]

    for (const type of sitemapTypes) {
      expect(v.safeParse(sitemapEntrySchema, { type }).success).toBe(true)
    }
    for (const type of contentTypes) {
      expect(v.safeParse(sitemapEntrySchema, { type: "SITEMAP", contents: [{ type }] }).success).toBe(true)
    }
  })

  it("validates sitemap schemas strictly", () => {
    expect(v.safeParse(sitemapContentSchema, { type: "WEB", submitted: "10", indexed: "8" }).success).toBe(true)
    expect(
      v.safeParse(sitemapEntrySchema, {
        path: "https://example.com/sitemap.xml",
        type: "sitemap",
        contents: [{ type: "web", submitted: "10", indexed: "8" }],
        lastSubmitted: "2026-08-19T12:00:00.123Z",
        lastDownloaded: "2026-08-19T12:00:00-07:00",
      }).success,
    ).toBe(true)
    expect(v.safeParse(sitemapEntrySchema, {}).success).toBe(true)
    expect(v.safeParse(sitemapEntrySchema, { path: "https://example.com/sitemap.xml", type: "SITEMAP" }).success).toBe(
      true,
    )
    const emptyResponse = v.safeParse(sitemapsListResponseSchema, {})
    expect(emptyResponse.success).toBe(true)
    if (emptyResponse.success) expect(emptyResponse.output).toEqual({})
    expect(v.safeParse(sitemapEntrySchema, { path: "https://example.com/sitemap.xml", type: "UNKNOWN" }).success).toBe(
      false,
    )
    expect(v.safeParse(sitemapEntrySchema, { contents: [{ type: "UNKNOWN" }] }).success).toBe(false)
    expect(v.safeParse(sitemapEntrySchema, { contents: [{ type: "dataFeedElement" }] }).success).toBe(false)
    expect(v.safeParse(sitemapEntrySchema, { type: "oceanfront" }).success).toBe(false)
    expect(v.safeParse(sitemapEntrySchema, { lastSubmitted: "2026-02-30T12:00:00Z" }).success).toBe(false)
  })

  it("lists sitemaps with an optional sitemap index query", async () => {
    const siteUrl = "https://example.com/!/'()*?x=1#fragment"
    const client = clientCreate(async (input, init) => {
      expect(input.toString()).toBe(
        "https://searchconsole.googleapis.com/webmasters/v3/sites/https%3A%2F%2Fexample.com%2F%21%2F%27%28%29%2A%3Fx%3D1%23fragment/sitemaps?sitemapIndex=https%3A%2F%2Fexample.com%2Fsitemap-index.xml",
      )
      expect(init?.method).toBe("GET")
      expect(new Headers(init?.headers).get("Authorization")).toBe("Bearer test-token")
      return new Response(JSON.stringify({ sitemap: [{ path: "https://example.com/sitemap.xml", type: "sitemap" }] }))
    })

    const result = await sitemapsList(client, siteUrl, "https://example.com/sitemap-index.xml")
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.sitemap?.[0]?.type).toBe("sitemap")
  })

  it("uses encoded sitemap paths and the correct CRUD methods", async () => {
    const calls: string[] = []
    const siteUrl = "https://example.com/!/'()*?x=1#fragment"
    const feedpath = "https://example.com/sitemap!/'()*?x=1#fragment"
    const client = clientCreate(async (input, init) => {
      calls.push(`${init?.method}:${input.toString()}`)
      if (init?.method === "GET") {
        return new Response(JSON.stringify({ path: "https://example.com/sitemap file.xml", isPending: false }))
      }
      return new Response(null, { status: 204 })
    })

    expect((await sitemapGet(client, siteUrl, feedpath)).success).toBe(true)
    expect((await sitemapSubmit(client, siteUrl, feedpath)).success).toBe(true)
    expect((await sitemapDelete(client, siteUrl, feedpath)).success).toBe(true)
    expect(calls).toEqual([
      "GET:https://searchconsole.googleapis.com/webmasters/v3/sites/https%3A%2F%2Fexample.com%2F%21%2F%27%28%29%2A%3Fx%3D1%23fragment/sitemaps/https%3A%2F%2Fexample.com%2Fsitemap%21%2F%27%28%29%2A%3Fx%3D1%23fragment",
      "PUT:https://searchconsole.googleapis.com/webmasters/v3/sites/https%3A%2F%2Fexample.com%2F%21%2F%27%28%29%2A%3Fx%3D1%23fragment/sitemaps/https%3A%2F%2Fexample.com%2Fsitemap%21%2F%27%28%29%2A%3Fx%3D1%23fragment",
      "DELETE:https://searchconsole.googleapis.com/webmasters/v3/sites/https%3A%2F%2Fexample.com%2F%21%2F%27%28%29%2A%3Fx%3D1%23fragment/sitemaps/https%3A%2F%2Fexample.com%2Fsitemap%21%2F%27%28%29%2A%3Fx%3D1%23fragment",
    ])
  })

  it("returns validation errors without fetching", async () => {
    let fetchCalled = false
    const client = clientCreate(async () => {
      fetchCalled = true
      return new Response(null, { status: 204 })
    })

    const result = await sitemapDelete(client, "not-a-site", "https://example.com/sitemap.xml")
    expect(result.success).toBe(false)
    expect(fetchCalled).toBe(false)
    if (!result.success) expect(result.op).toBe("sitemapDelete")
  })
})
