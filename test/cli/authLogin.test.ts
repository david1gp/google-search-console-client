import { describe, expect, it } from "bun:test"
import { chmod, mkdir, mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import type { StricliProcess } from "@stricli/core"
import { googleSearchConsoleCliApplication, googleSearchConsoleCliRun } from "../../src/cli/index.js"
import { googleSearchConsoleOAuthScope } from "../../src/index.js"

describe("Google Search Console OAuth login command", () => {
  it("renders the documented auth login help without requiring credentials", async () => {
    const result = await googleSearchConsoleCliRunResult(["auth", "login", "--help"], {})

    expect(result.exitCode).toBe(0)
    expect(result.stderr).toBe("")
    expect(JSON.parse(result.stdout)).toEqual({
      success: true,
      data:
        "USAGE\n" +
        "  google-search-console auth login [--agent] [--callback-url url] [--client-id client-id] [--client-secret client-secret] [--credentials-file path] [--env-file path]\n" +
        "  google-search-console auth login --help\n" +
        "\n" +
        "Authorize Search Console with OAuth\n" +
        "\n" +
        "FLAGS\n" +
        "     [--agent/--no-agent]  Print the authorization URL and exit without opening a browser\n" +
        "     [--callback-url]      Complete an existing OAuth authorization\n" +
        "     [--client-id]         OAuth desktop client ID\n" +
        "     [--client-secret]     Optional OAuth desktop client secret\n" +
        "     [--credentials-file]  Path to save OAuth credentials\n" +
        "     [--env-file]          Load credentials and URLs from a dotenv file\n" +
        "  -h  --help               Print help information and exit",
    })
  })

  it("returns an agent handoff without printing secrets or opening a browser", async () => {
    const directory = await mkdtemp(join(tmpdir(), "google-search-console-cli-login-"))
    const credentialsFile = join(directory, "credentials.json")
    const clientSecret = "client-secret-that-must-not-leak"

    try {
      const result = await googleSearchConsoleCliRunResult(
        [
          "auth",
          "login",
          "--agent",
          "--client-id",
          "client-id",
          "--client-secret",
          clientSecret,
          "--credentials-file",
          credentialsFile,
        ],
        {},
      )
      expect(result.exitCode).toBe(0)
      expect(result.stderr).toBe("")
      expect(result.stdout).not.toContain(clientSecret)

      const output = JSON.parse(result.stdout)
      expect(output).toMatchObject({ success: true, data: { status: "pending" } })
      expect(output.data.authorizationUrl).toContain(`scope=${encodeURIComponent(googleSearchConsoleOAuthScope)}`)
      expect(output.data.authorizationUrl).not.toContain(clientSecret)
      expect(output.data.completionCommand).toContain(`--credentials-file '${credentialsFile}'`)
      expect(output.data.instructions).toEqual([
        "Open the authorizationUrl in a browser.",
        "After authorization, the browser will show a failed loopback redirect; copy the complete redirect URL from the address bar.",
        "Replace PASTE_COMPLETE_LOOPBACK_REDIRECT_URL in completionCommand with that URL and run the command.",
      ])
      expect(result.stdout).not.toContain("codeVerifier")
      expect((await stat(output.data.pendingStateFile)).mode & 0o777).toBe(0o600)
    } finally {
      await rm(directory, { force: true, recursive: true })
    }
  })

  it("uses the default credentials path consistently in the agent handoff", async () => {
    const directory = await mkdtemp(join(tmpdir(), "google-search-console-cli-login-"))
    const credentialsFile = join(directory, ".config/google-search-console/credentials.json")

    try {
      const result = await googleSearchConsoleCliRunResult(["auth", "login", "--agent", "--client-id", "client-id"], {
        HOME: directory,
      })
      expect(result.exitCode).toBe(0)
      const output = JSON.parse(result.stdout)
      expect(output.data.credentialsFile).toBe(credentialsFile)
      expect(output.data.pendingStateFile).toBe(join(directory, ".config/google-search-console/.oauth-pending.json"))
      expect(output.data.completionCommand).toContain(`--credentials-file '${credentialsFile}'`)
    } finally {
      await rm(directory, { force: true, recursive: true })
    }
  })

  it("uses the credentials flag before the credentials environment path and client config", async () => {
    const directory = await mkdtemp(join(tmpdir(), "google-search-console-cli-login-"))
    const credentialsFile = join(directory, "flag-credentials.json")
    const environmentCredentialsFile = join(directory, "environment-credentials.json")
    await writeFile(credentialsFile, JSON.stringify({ client_id: "flag-client-id" }))
    await writeFile(environmentCredentialsFile, JSON.stringify({ client_id: "environment-client-id" }))

    try {
      const result = await googleSearchConsoleCliRunResult(
        ["auth", "login", "--agent", "--credentials-file", credentialsFile],
        { GOOGLE_SEARCH_CONSOLE_CREDENTIALS_FILE: environmentCredentialsFile },
      )
      expect(result.exitCode).toBe(0)
      const output = JSON.parse(result.stdout)
      expect(output.data.credentialsFile).toBe(credentialsFile)
      expect(new URL(output.data.authorizationUrl).searchParams.get("client_id")).toBe("flag-client-id")
      expect(output.data.completionCommand).toContain(`--credentials-file '${credentialsFile}'`)
    } finally {
      await rm(directory, { force: true, recursive: true })
    }
  })

  it("completes an agent handoff from a later callback URL", async () => {
    const directory = await mkdtemp(join(tmpdir(), "google-search-console-cli-login-"))
    const credentialsFile = join(directory, "credentials.json")
    const tokenUrl = "https://oauth.example.test/token"
    const originalFetch = globalThis.fetch
    let requestBody = ""
    let requestUrl = ""
    globalThis.fetch = (async (_input, init) => {
      requestUrl = String(_input)
      requestBody = String(init?.body)
      return Response.json({
        access_token: "access-token",
        expires_in: 3600,
        refresh_token: "refresh-token",
        scope: googleSearchConsoleOAuthScope,
      })
    }) as typeof fetch

    try {
      const agentResult = await googleSearchConsoleCliRunResult(
        ["auth", "login", "--agent", "--client-id", "client-id", "--credentials-file", credentialsFile],
        { GOOGLE_SEARCH_CONSOLE_OAUTH_TOKEN_URL: tokenUrl },
      )
      const agentOutput = JSON.parse(agentResult.stdout)
      const authorizationUrl = new URL(agentOutput.data.authorizationUrl)
      const state = authorizationUrl.searchParams.get("state")
      if (state === null) throw new Error("Agent authorization URL did not include state")
      const callbackUrl = `${agentOutput.data.callbackUrl}?code=authorization-code&scope=${encodeURIComponent(
        googleSearchConsoleOAuthScope,
      )}&state=${encodeURIComponent(state)}`

      const callbackResult = await googleSearchConsoleCliRunResult(
        ["auth", "login", "--callback-url", callbackUrl, "--credentials-file", credentialsFile],
        {},
      )
      expect(callbackResult.exitCode).toBe(0)
      expect(JSON.parse(callbackResult.stdout)).toEqual({
        success: true,
        data: { credentialsFile, status: "authorized" },
      })
      expect(Object.fromEntries(new URLSearchParams(requestBody))).toMatchObject({
        client_id: "client-id",
        code: "authorization-code",
        grant_type: "authorization_code",
      })
      expect(requestUrl).toBe(tokenUrl)
      expect(JSON.parse(await readFile(credentialsFile, "utf8"))).toMatchObject({
        client_id: "client-id",
        refresh_token: "refresh-token",
        token_uri: tokenUrl,
      })
    } finally {
      globalThis.fetch = originalFetch
      await rm(directory, { force: true, recursive: true })
    }
  })

  it("completes the normal browser flow through the loopback callback", async () => {
    if (process.platform !== "linux") return

    const directory = await mkdtemp(join(tmpdir(), "google-search-console-cli-login-"))
    const browserDirectory = join(directory, "bin")
    const credentialsFile = join(directory, "credentials.json")
    const tokenUrl = "https://oauth.example.test/token"
    await mkdir(browserDirectory, { recursive: true })
    await writeFile(
      join(browserDirectory, "xdg-open"),
      `#!/bin/sh
exec ${googleSearchConsoleOAuthLoginShellQuote(process.execPath)} -e ${googleSearchConsoleOAuthLoginShellQuote(
        `const authorizationUrl = process.argv[1]
const authorization = new URL(authorizationUrl)
const redirectValue = authorization.searchParams.get("redirect_uri")
if (redirectValue === null) process.exit(1)
const callback = new URL(redirectValue)
callback.searchParams.set("code", "authorization-code")
callback.searchParams.set("scope", ${JSON.stringify(googleSearchConsoleOAuthScope)})
callback.searchParams.set("state", authorization.searchParams.get("state") ?? "")
const response = await fetch(callback)
if (!response.ok) process.exit(1)`,
      )} "$1"
`,
    )
    await chmod(join(browserDirectory, "xdg-open"), 0o700)

    const originalFetch = globalThis.fetch
    let requestBody = ""
    globalThis.fetch = (async (_input, init) => {
      requestBody = String(init?.body)
      return Response.json({
        access_token: "access-token",
        expires_in: 3600,
        refresh_token: "refresh-token",
        scope: googleSearchConsoleOAuthScope,
      })
    }) as typeof fetch

    try {
      const result = await googleSearchConsoleCliRunResult(
        ["auth", "login", "--client-id", "client-id", "--credentials-file", credentialsFile],
        { PATH: browserDirectory, GOOGLE_SEARCH_CONSOLE_OAUTH_TOKEN_URL: tokenUrl },
      )
      expect(result.exitCode).toBe(0)
      expect(result.stderr).toBe("")
      expect(JSON.parse(result.stdout)).toEqual({
        success: true,
        data: { credentialsFile, status: "authorized" },
      })
      expect(Object.fromEntries(new URLSearchParams(requestBody))).toMatchObject({
        client_id: "client-id",
        code: "authorization-code",
        grant_type: "authorization_code",
      })
      expect(Object.fromEntries(new URLSearchParams(requestBody))).not.toHaveProperty("client_secret")
      expect(JSON.parse(await readFile(credentialsFile, "utf8"))).toMatchObject({
        client_id: "client-id",
        refresh_token: "refresh-token",
        token_uri: tokenUrl,
      })
    } finally {
      globalThis.fetch = originalFetch
      await rm(directory, { force: true, recursive: true })
    }
  })

  it("rejects incompatible agent and callback flags", async () => {
    const directory = await mkdtemp(join(tmpdir(), "google-search-console-cli-login-"))
    const credentialsFile = join(directory, "credentials.json")

    try {
      const result = await googleSearchConsoleCliRunResult(
        [
          "auth",
          "login",
          "--agent",
          "--callback-url",
          "https://example.test/callback",
          "--credentials-file",
          credentialsFile,
        ],
        {},
      )
      expect(result.exitCode).toBe(1)
      expect(result.stdout).toBe("")
      expect(JSON.parse(result.stderr)).toMatchObject({
        success: false,
        op: "googleSearchConsoleOAuthLogin",
        errorMessage: "--agent and --callback-url cannot be used together",
      })
    } finally {
      await rm(directory, { force: true, recursive: true })
    }
  })

  it("returns a resumable handoff when browser launch fails", async () => {
    if (process.platform !== "linux") return

    const directory = await mkdtemp(join(tmpdir(), "google-search-console-cli-login-"))
    const browserDirectory = join(directory, "bin")
    const credentialsFile = join(directory, "credentials.json")
    await mkdir(browserDirectory, { recursive: true })
    const browserPath = join(browserDirectory, "xdg-open")
    await writeFile(browserPath, "#!/bin/sh\nexit 1\n")
    await chmod(browserPath, 0o700)

    try {
      const result = await googleSearchConsoleCliRunResult(
        ["auth", "login", "--client-id", "client-id", "--credentials-file", credentialsFile],
        { PATH: browserDirectory },
      )
      expect(result.exitCode).toBe(1)
      expect(result.stdout).toBe("")
      const output = JSON.parse(result.stderr)
      expect(output).toMatchObject({ success: false, op: "googleSearchConsoleOAuthLogin" })
      expect(JSON.parse(output.errorData)).toMatchObject({ status: "pending" })
      expect(await stat(JSON.parse(output.errorData).pendingStateFile)).toBeTruthy()
    } finally {
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

function googleSearchConsoleOAuthLoginShellQuote(value: string): string {
  return `'${value.replaceAll("'", "'\\''")}'`
}
