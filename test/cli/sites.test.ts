import { describe, expect, it } from "bun:test"
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import type { StricliProcess } from "@stricli/core"
import { googleSearchConsoleCliApplication, googleSearchConsoleCliRun } from "../../src/cli/index.js"
import { sitesRouteMap } from "../../src/cli/sites/sitesRouteMap.js"

describe("Sites CLI commands", () => {
  it("exposes composable list, get, add, and delete routes", () => {
    expect(sitesRouteMap.getAllEntries().map((entry) => entry.name.original)).toEqual(["list", "get", "add", "delete"])
  })

  it("aggregates sites in default-first profile order and preserves permission levels", async () => {
    const directory = await mkdtemp(join(tmpdir(), "google-search-console-cli-sites-"))
    const credentialsRoot = join(directory, ".config/google-search-console")
    const profilesRoot = join(credentialsRoot, "profiles")
    const serverRequests: string[] = []
    await mkdir(join(profilesRoot, "work"), { recursive: true })
    await mkdir(join(profilesRoot, "zeta"), { recursive: true })
    await writeFile(join(credentialsRoot, "credentials.json"), JSON.stringify({ accessToken: "default-token" }))
    await writeFile(join(profilesRoot, "work/credentials.json"), JSON.stringify({ accessToken: "work-token" }))
    await writeFile(join(profilesRoot, "zeta/credentials.json"), JSON.stringify({ accessToken: "zeta-token" }))

    const server = Bun.serve({
      port: 0,
      fetch(request) {
        const authorization = request.headers.get("Authorization") ?? ""
        serverRequests.push(authorization)
        const responseByAuthorization: Record<string, unknown> = {
          "Bearer default-token": {
            siteEntry: [{ siteUrl: "sc-domain:default.example", permissionLevel: "siteOwner" }],
          },
          "Bearer work-token": {
            siteEntry: [{ siteUrl: "sc-domain:shared.example", permissionLevel: "siteFullUser" }],
          },
          "Bearer zeta-token": {
            siteEntry: [{ siteUrl: "sc-domain:shared.example", permissionLevel: "siteRestrictedUser" }],
          },
        }
        return Response.json(responseByAuthorization[authorization] ?? { siteEntry: [] })
      },
    })

    try {
      const result = await googleSearchConsoleCliRunResult(
        ["sites", "list", "--all-profiles", "--base-url", `http://127.0.0.1:${server.port}`],
        { HOME: directory },
      )

      expect(result.exitCode).toBe(0)
      expect(result.stderr).toBe("")
      expect(serverRequests).toEqual(["Bearer default-token", "Bearer work-token", "Bearer zeta-token"])
      expect(JSON.parse(result.stdout)).toEqual({
        success: true,
        data: {
          siteEntry: [
            { siteUrl: "sc-domain:default.example", permissionLevel: "siteOwner", profile: "default" },
            { siteUrl: "sc-domain:shared.example", permissionLevel: "siteFullUser", profile: "work" },
            { siteUrl: "sc-domain:shared.example", permissionLevel: "siteRestrictedUser", profile: "zeta" },
          ],
        },
      })
    } finally {
      server.stop()
      await rm(directory, { force: true, recursive: true })
    }
  })

  it("rejects ambiguous all-profile selections and an empty profile set", async () => {
    const directory = await mkdtemp(join(tmpdir(), "google-search-console-cli-sites-"))

    try {
      const selectedProfileResult = await googleSearchConsoleCliRunResult(
        ["sites", "list", "--all-profiles", "--profile", "work"],
        { HOME: directory },
      )
      expect(selectedProfileResult.exitCode).toBe(1)
      expect(JSON.parse(selectedProfileResult.stderr)).toMatchObject({
        success: false,
        op: "sitesListAllProfiles",
        errorMessage: "--all-profiles cannot be combined with --profile",
      })

      const emptyResult = await googleSearchConsoleCliRunResult(["sites", "list", "--all-profiles"], {
        HOME: directory,
      })
      expect(emptyResult.exitCode).toBe(1)
      expect(JSON.parse(emptyResult.stderr)).toMatchObject({
        success: false,
        op: "sitesListAllProfiles",
        errorMessage: "No configured credential profiles were found",
      })
    } finally {
      await rm(directory, { force: true, recursive: true })
    }
  })

  it("rejects the legacy credentials-file environment override for all-profile listing", async () => {
    const directory = await mkdtemp(join(tmpdir(), "google-search-console-cli-sites-"))
    const credentialsFile = join(directory, "credentials.json")
    await writeFile(credentialsFile, JSON.stringify({ accessToken: "token" }))

    try {
      const result = await googleSearchConsoleCliRunResult(["sites", "list", "--all-profiles"], {
        HOME: directory,
        GOOGLE_SEARCH_CONSOLE_CREDENTIALS_FILE: credentialsFile,
      })
      expect(result.exitCode).toBe(1)
      expect(JSON.parse(result.stderr)).toMatchObject({
        success: false,
        op: "sitesListAllProfiles",
        errorMessage: "Cannot use --all-profiles with GOOGLE_SEARCH_CONSOLE_CREDENTIALS_FILE",
      })
    } finally {
      await rm(directory, { force: true, recursive: true })
    }
  })

  it("attributes a profile configuration failure in all-profile errors", async () => {
    const directory = await mkdtemp(join(tmpdir(), "google-search-console-cli-sites-"))
    const credentialsRoot = join(directory, ".config/google-search-console")
    const brokenProfileRoot = join(credentialsRoot, "profiles/broken")
    await mkdir(brokenProfileRoot, { recursive: true })
    await writeFile(join(credentialsRoot, "credentials.json"), JSON.stringify({ accessToken: "default-token" }))
    await writeFile(join(brokenProfileRoot, "credentials.json"), "{}")

    const server = Bun.serve({
      port: 0,
      fetch() {
        return Response.json({ siteEntry: [] })
      },
    })

    try {
      const result = await googleSearchConsoleCliRunResult(
        ["sites", "list", "--all-profiles", "--base-url", `http://127.0.0.1:${server.port}`],
        { HOME: directory },
      )
      expect(result.exitCode).toBe(1)
      expect(JSON.parse(result.stderr)).toMatchObject({
        success: false,
        op: "sitesListAllProfiles",
        errorMessage: expect.stringContaining('Profile "broken": Invalid credentials file'),
      })
    } finally {
      server.stop()
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
