import { describe, expect, it } from "bun:test"
import { mkdtemp, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import type { StricliProcess } from "@stricli/core"
import { googleSearchConsoleCliApplication, googleSearchConsoleCliRun } from "../../src/cli/index.js"

describe("Search Console site onboarding command", () => {
  it("reports a useful error when Cloudflare credentials are missing", async () => {
    const result = await googleSearchConsoleCliRunResult(
      ["sites", "onboard", "eventoren.de", "--access-token", "token"],
      {},
    )

    expect(result.exitCode).toBe(1)
    expect(JSON.parse(result.stderr)).toMatchObject({
      success: false,
      op: "googleSearchConsoleCliCloudflareApiTokenResolve",
      errorMessage: "CLOUDFLARE_API_TOKEN is required; set it in the environment or --env-file",
    })
  })

  it("onboards a domain using CLOUDFLARE_API_TOKEN from the env file", async () => {
    const directory = await mkdtemp(join(tmpdir(), "google-search-console-cli-onboard-"))
    const envFile = join(directory, ".env")
    await writeFile(envFile, "CLOUDFLARE_API_TOKEN=cloudflare-token\n")
    const originalFetch = globalThis.fetch
    const calls: string[] = []
    globalThis.fetch = (async (input, init) => {
      const url = input.toString()
      calls.push(`${init?.method ?? "GET"}:${url}`)
      if (url.endsWith("/siteVerification/v1/token"))
        return Response.json({ method: "DNS_TXT", token: "google-site-verification=token" })
      if (url.includes("/zones?"))
        return Response.json({ success: true, result: [{ id: "zone-id", name: "eventoren.de" }] })
      if (url.includes("/dns_records") && init?.method !== "POST") return Response.json({ success: true, result: [] })
      if (url.includes("/dns_records") && init?.method === "POST")
        return Response.json({
          success: true,
          result: {
            id: "record-id",
            type: "TXT",
            name: "eventoren.de",
            content: "google-site-verification=token",
            ttl: 1,
          },
        })
      if (url.includes("/webResource?")) return Response.json({ id: "resource-id" })
      if (url.includes("/webmasters/v3/sites/")) return new Response(null, { status: 204 })
      return new Response("unexpected request", { status: 500 })
    }) as typeof fetch

    try {
      const result = await googleSearchConsoleCliRunResult(
        ["sites", "onboard", "eventoren.de", "--access-token", "google-token", "--env-file", envFile],
        {},
      )

      expect(result.exitCode).toBe(0)
      expect(JSON.parse(result.stdout)).toEqual({
        success: true,
        data: {
          domain: "eventoren.de",
          siteUrl: "sc-domain:eventoren.de",
          txtRecordCreated: true,
          verificationAttempts: 1,
        },
      })
      expect(calls.some((call) => call.startsWith("POST:https://api.cloudflare.com/"))).toBe(true)
    } finally {
      globalThis.fetch = originalFetch
      await rm(directory, { force: true, recursive: true })
    }
  })
})

async function googleSearchConsoleCliRunResult(
  inputs: readonly string[],
  env: Readonly<Record<string, string | undefined>>,
): Promise<{
  readonly exitCode: number | string | null | undefined
  readonly stderr: string
  readonly stdout: string
}> {
  const output = { stderr: "", stdout: "" }
  const process: StricliProcess = {
    env,
    exitCode: undefined,
    stderr: { write: (value) => (output.stderr += value) },
    stdout: { write: (value) => (output.stdout += value) },
  }
  await googleSearchConsoleCliRun(googleSearchConsoleCliApplication, inputs, process)
  return { exitCode: process.exitCode, stderr: output.stderr.trim(), stdout: output.stdout.trim() }
}
