import { describe, expect, it } from "bun:test"
import * as v from "valibot"
import { googleSearchConsoleClientCreate } from "../../src/googleSearchConsoleClientCreate.js"
import type { GoogleSearchConsoleFetch } from "../../src/shared/googleSearchConsoleFetch.js"
import { siteAdd } from "../../src/sites/add/siteAdd.js"
import { siteDelete } from "../../src/sites/delete/siteDelete.js"
import { siteGet } from "../../src/sites/get/siteGet.js"
import { sitesList } from "../../src/sites/list/sitesList.js"
import { siteEntrySchema } from "../../src/sites/schemas/siteEntrySchema.js"
import { sitesListResponseSchema } from "../../src/sites/schemas/sitesListResponseSchema.js"

describe("Sites endpoints", () => {
  const clientCreate = (fetch: GoogleSearchConsoleFetch) => {
    const result = googleSearchConsoleClientCreate({
      accessToken: "test-token",
      fetch,
    })
    if (!result.success) throw new Error(result.errorMessage)
    return result.data
  }

  it("validates site schemas", () => {
    expect(
      v.safeParse(siteEntrySchema, { siteUrl: "sc-domain:example.com", permissionLevel: "siteOwner" }).success,
    ).toBe(true)
    expect(v.safeParse(siteEntrySchema, { siteUrl: "not-a-site", permissionLevel: "siteOwner" }).success).toBe(false)
    expect(v.safeParse(siteEntrySchema, {}).success).toBe(true)
    const emptyResponse = v.safeParse(sitesListResponseSchema, {})
    expect(emptyResponse.success).toBe(true)
    if (emptyResponse.success) expect(emptyResponse.output).toEqual({})
    expect(v.safeParse(siteEntrySchema, { permissionLevel: "SITE_OWNER" }).success).toBe(false)
  })

  it("lists sites with the shared OAuth transport", async () => {
    const client = clientCreate(async (input, init) => {
      expect(input.toString()).toBe("https://searchconsole.googleapis.com/webmasters/v3/sites")
      expect(init?.method).toBe("GET")
      expect(new Headers(init?.headers).get("Authorization")).toBe("Bearer test-token")
      return new Response(
        JSON.stringify({ siteEntry: [{ siteUrl: "https://example.com/", permissionLevel: "siteOwner" }] }),
      )
    })

    const result = await sitesList(client)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.siteEntry?.[0]?.siteUrl).toBe("https://example.com/")
      expect(result.data.siteEntry?.[0]?.permissionLevel).toBe("siteOwner")
    }
  })

  it("uses encoded site URLs and the correct CRUD methods", async () => {
    const calls: string[] = []
    const siteUrl = "https://example.com/!/'()*?x=1#fragment"
    const client = clientCreate(async (input, init) => {
      calls.push(`${init?.method}:${input.toString()}`)
      if (init?.method === "GET") {
        return new Response(JSON.stringify({ siteUrl: "https://example.com/", permissionLevel: "siteOwner" }))
      }
      return new Response(null, { status: 204 })
    })

    expect((await siteGet(client, siteUrl)).success).toBe(true)
    expect((await siteAdd(client, siteUrl)).success).toBe(true)
    expect((await siteDelete(client, siteUrl)).success).toBe(true)
    expect(calls).toEqual([
      "GET:https://searchconsole.googleapis.com/webmasters/v3/sites/https%3A%2F%2Fexample.com%2F%21%2F%27%28%29%2A%3Fx%3D1%23fragment",
      "PUT:https://searchconsole.googleapis.com/webmasters/v3/sites/https%3A%2F%2Fexample.com%2F%21%2F%27%28%29%2A%3Fx%3D1%23fragment",
      "DELETE:https://searchconsole.googleapis.com/webmasters/v3/sites/https%3A%2F%2Fexample.com%2F%21%2F%27%28%29%2A%3Fx%3D1%23fragment",
    ])
  })

  it("returns validation errors without fetching", async () => {
    let fetchCalled = false
    const client = clientCreate(async () => {
      fetchCalled = true
      return new Response(null, { status: 204 })
    })

    const result = await siteDelete(client, "not-a-site")
    expect(result.success).toBe(false)
    expect(fetchCalled).toBe(false)
    if (!result.success) expect(result.op).toBe("siteDelete")
  })
})
