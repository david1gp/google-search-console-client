import { describe, expect, it } from "bun:test"
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import type { StricliProcess } from "@stricli/core"
import { packageVersion } from "../../src/packageVersion.js"
import {
  googleSearchConsoleCliApplication,
  googleSearchConsoleCliConfigCreate,
  googleSearchConsoleCliRouteMap,
  googleSearchConsoleCliRun,
} from "../../src/cli/index.js"

describe("Google Search Console CLI", () => {
  it("composes all endpoint route maps", () => {
    expect(googleSearchConsoleCliRouteMap.getAllEntries().map((entry) => entry.name.original)).toEqual([
      "mobileFriendlyTest",
      "searchAnalytics",
      "sitemaps",
      "sites",
      "urlInspection",
    ])
  })

  it("prints the current package version when --version is requested", async () => {
    const result = await googleSearchConsoleCliRunResult(["--version"], {})
    expect(result.exitCode).toBe(0)
    expect(result.stderr).toBe("")
    expect(JSON.parse(result.stdout)).toEqual({ success: true, data: packageVersion })
  })

  it("loads validated credentials with flag, environment, and env-file precedence", async () => {
    const directory = await mkdtemp(join(tmpdir(), "google-search-console-cli-"))
    const credentialsDirectory = join(directory, ".config/google-search-console")
    const envFile = join(directory, ".env")
    await mkdir(credentialsDirectory, { recursive: true })
    await writeFile(
      join(credentialsDirectory, "credentials.json"),
      JSON.stringify({
        accessToken: "json-token",
        mobileFriendlyApiKey: "json-key",
        baseUrl: "https://json.example.test",
        urlInspectionBaseUrl: "https://json-inspection.example.test",
      }),
    )
    await writeFile(
      envFile,
      [
        "GOOGLE_SEARCH_CONSOLE_ACCESS_TOKEN=file-token",
        "GOOGLE_SEARCH_CONSOLE_BASE_URL=https://file.example.test",
      ].join("\n"),
    )

    try {
      const result = await googleSearchConsoleCliConfigCreate({
        accessToken: "flag-token",
        env: {
          HOME: directory,
          GOOGLE_SEARCH_CONSOLE_ACCESS_TOKEN: "environment-token",
          GOOGLE_SEARCH_CONSOLE_MOBILE_FRIENDLY_API_KEY: "environment-key",
        },
        envFile,
      })
      expect(result).toEqual({
        success: true,
        data: {
          accessToken: "flag-token",
          mobileFriendlyApiKey: "environment-key",
          baseUrl: "https://file.example.test",
          urlInspectionBaseUrl: "https://json-inspection.example.test",
        },
      })
    } finally {
      await rm(directory, { force: true, recursive: true })
    }
  })

  it("loads nested OAuth credentials from JSON and applies the default token URL", async () => {
    const directory = await mkdtemp(join(tmpdir(), "google-search-console-cli-"))
    const credentialsFile = join(directory, "credentials.json")
    await writeFile(
      credentialsFile,
      JSON.stringify({
        oauth: {
          clientId: "nested-client-id",
          clientSecret: "nested-client-secret",
          refreshToken: "nested-refresh-token",
        },
      }),
    )

    try {
      const result = await googleSearchConsoleCliConfigCreate({
        env: { GOOGLE_SEARCH_CONSOLE_CREDENTIALS_FILE: credentialsFile },
      })
      expect(result).toEqual({
        success: true,
        data: {
          oauth: {
            clientId: "nested-client-id",
            clientSecret: "nested-client-secret",
            refreshToken: "nested-refresh-token",
            tokenUrl: "https://oauth2.googleapis.com/token",
          },
          baseUrl: "https://searchconsole.googleapis.com/webmasters/v3",
          urlInspectionBaseUrl: "https://searchconsole.googleapis.com/v1",
        },
      })
    } finally {
      await rm(directory, { force: true, recursive: true })
    }
  })

  it("loads flat Google authorized-user OAuth credentials from JSON", async () => {
    const directory = await mkdtemp(join(tmpdir(), "google-search-console-cli-"))
    const credentialsFile = join(directory, "credentials.json")
    await writeFile(
      credentialsFile,
      JSON.stringify({
        client_id: "flat-client-id",
        client_secret: "flat-client-secret",
        refresh_token: "flat-refresh-token",
        token_uri: "https://oauth.example.test/token",
      }),
    )

    try {
      const result = await googleSearchConsoleCliConfigCreate({
        env: { GOOGLE_SEARCH_CONSOLE_CREDENTIALS_FILE: credentialsFile },
      })
      expect(result).toEqual({
        success: true,
        data: {
          oauth: {
            clientId: "flat-client-id",
            clientSecret: "flat-client-secret",
            refreshToken: "flat-refresh-token",
            tokenUrl: "https://oauth.example.test/token",
          },
          baseUrl: "https://searchconsole.googleapis.com/webmasters/v3",
          urlInspectionBaseUrl: "https://searchconsole.googleapis.com/v1",
        },
      })
    } finally {
      await rm(directory, { force: true, recursive: true })
    }
  })

  it("merges partial nested OAuth credentials with flat authorized-user fields", async () => {
    const directory = await mkdtemp(join(tmpdir(), "google-search-console-cli-"))
    const credentialsFile = join(directory, "credentials.json")
    await writeFile(
      credentialsFile,
      JSON.stringify({
        oauth: {
          clientId: "nested-client-id",
          tokenUrl: "https://nested.example.test/token",
        },
        client_id: "flat-client-id",
        client_secret: "flat-client-secret",
        refresh_token: "flat-refresh-token",
        token_uri: "https://flat.example.test/token",
      }),
    )

    try {
      const result = await googleSearchConsoleCliConfigCreate({
        env: { GOOGLE_SEARCH_CONSOLE_CREDENTIALS_FILE: credentialsFile },
      })
      expect(result).toMatchObject({
        success: true,
        data: {
          oauth: {
            clientId: "nested-client-id",
            clientSecret: "flat-client-secret",
            refreshToken: "flat-refresh-token",
            tokenUrl: "https://nested.example.test/token",
          },
        },
      })
    } finally {
      await rm(directory, { force: true, recursive: true })
    }
  })

  it("uses a static access token when OAuth credentials are partial", async () => {
    const directory = await mkdtemp(join(tmpdir(), "google-search-console-cli-"))
    const credentialsFile = join(directory, "credentials.json")
    await writeFile(
      credentialsFile,
      JSON.stringify({
        accessToken: "static-token",
        oauth: { clientId: "partial-client-id" },
      }),
    )

    try {
      const result = await googleSearchConsoleCliConfigCreate({
        env: { GOOGLE_SEARCH_CONSOLE_CREDENTIALS_FILE: credentialsFile },
      })
      expect(result).toMatchObject({
        success: true,
        data: {
          accessToken: "static-token",
        },
      })
      if (result.success) expect(result.data.oauth).toBeUndefined()
    } finally {
      await rm(directory, { force: true, recursive: true })
    }
  })

  it("loads OAuth credentials from direct environment and dotenv values", async () => {
    const directory = await mkdtemp(join(tmpdir(), "google-search-console-cli-"))
    const envFile = join(directory, ".env")
    await writeFile(
      envFile,
      [
        "GOOGLE_SEARCH_CONSOLE_OAUTH_CLIENT_ID=dotenv-client-id",
        "GOOGLE_SEARCH_CONSOLE_OAUTH_CLIENT_SECRET=dotenv-client-secret",
        "GOOGLE_SEARCH_CONSOLE_OAUTH_REFRESH_TOKEN=dotenv-refresh-token",
      ].join("\n"),
    )

    try {
      const directResult = await googleSearchConsoleCliConfigCreate({
        env: {
          GOOGLE_SEARCH_CONSOLE_OAUTH_CLIENT_ID: "environment-client-id",
          GOOGLE_SEARCH_CONSOLE_OAUTH_CLIENT_SECRET: "environment-client-secret",
          GOOGLE_SEARCH_CONSOLE_OAUTH_REFRESH_TOKEN: "environment-refresh-token",
          GOOGLE_SEARCH_CONSOLE_OAUTH_TOKEN_URL: "https://oauth.example.test/token",
        },
      })
      expect(directResult).toMatchObject({
        success: true,
        data: {
          oauth: {
            clientId: "environment-client-id",
            clientSecret: "environment-client-secret",
            refreshToken: "environment-refresh-token",
            tokenUrl: "https://oauth.example.test/token",
          },
        },
      })

      const dotenvResult = await googleSearchConsoleCliConfigCreate({ env: {}, envFile })
      expect(dotenvResult).toMatchObject({
        success: true,
        data: {
          oauth: {
            clientId: "dotenv-client-id",
            clientSecret: "dotenv-client-secret",
            refreshToken: "dotenv-refresh-token",
            tokenUrl: "https://oauth2.googleapis.com/token",
          },
        },
      })
    } finally {
      await rm(directory, { force: true, recursive: true })
    }
  })

  it("gives direct process-environment OAuth values precedence over dotenv and JSON", async () => {
    const directory = await mkdtemp(join(tmpdir(), "google-search-console-cli-"))
    const credentialsFile = join(directory, "credentials.json")
    const envFile = join(directory, ".env")
    await writeFile(
      credentialsFile,
      JSON.stringify({
        oauth: {
          clientId: "json-client-id",
          clientSecret: "json-client-secret",
          refreshToken: "json-refresh-token",
        },
      }),
    )
    await writeFile(
      envFile,
      [
        "GOOGLE_SEARCH_CONSOLE_OAUTH_CLIENT_ID=dotenv-client-id",
        "GOOGLE_SEARCH_CONSOLE_OAUTH_CLIENT_SECRET=dotenv-client-secret",
        "GOOGLE_SEARCH_CONSOLE_OAUTH_REFRESH_TOKEN=dotenv-refresh-token",
        "GOOGLE_SEARCH_CONSOLE_OAUTH_TOKEN_URL=https://dotenv.example.test/token",
      ].join("\n"),
    )

    try {
      const result = await googleSearchConsoleCliConfigCreate({
        env: {
          GOOGLE_SEARCH_CONSOLE_CREDENTIALS_FILE: credentialsFile,
          GOOGLE_SEARCH_CONSOLE_OAUTH_CLIENT_ID: "environment-client-id",
          GOOGLE_SEARCH_CONSOLE_OAUTH_CLIENT_SECRET: "environment-client-secret",
          GOOGLE_SEARCH_CONSOLE_OAUTH_REFRESH_TOKEN: "environment-refresh-token",
          GOOGLE_SEARCH_CONSOLE_OAUTH_TOKEN_URL: "https://environment.example.test/token",
        },
        envFile,
      })
      expect(result).toMatchObject({
        success: true,
        data: {
          oauth: {
            clientId: "environment-client-id",
            clientSecret: "environment-client-secret",
            refreshToken: "environment-refresh-token",
            tokenUrl: "https://environment.example.test/token",
          },
        },
      })
    } finally {
      await rm(directory, { force: true, recursive: true })
    }
  })

  it("loads credentials from the default path", async () => {
    const directory = await mkdtemp(join(tmpdir(), "google-search-console-cli-"))
    const credentialsDirectory = join(directory, ".config/google-search-console")
    await mkdir(credentialsDirectory, { recursive: true })
    await writeFile(
      join(credentialsDirectory, "credentials.json"),
      JSON.stringify({
        accessToken: "default-token",
        baseUrl: "https://default.example.test",
        urlInspectionBaseUrl: "https://default-inspection.example.test",
      }),
    )

    try {
      const result = await googleSearchConsoleCliConfigCreate({ env: { HOME: directory } })
      expect(result).toEqual({
        success: true,
        data: {
          accessToken: "default-token",
          baseUrl: "https://default.example.test",
          urlInspectionBaseUrl: "https://default-inspection.example.test",
        },
      })
    } finally {
      await rm(directory, { force: true, recursive: true })
    }
  })

  it("loads credentials from the USERPROFILE default path when HOME is absent", async () => {
    const directory = await mkdtemp(join(tmpdir(), "google-search-console-cli-"))
    const credentialsDirectory = join(directory, ".config/google-search-console")
    await mkdir(credentialsDirectory, { recursive: true })
    await writeFile(
      join(credentialsDirectory, "credentials.json"),
      JSON.stringify({ accessToken: "userprofile-token" }),
    )

    try {
      const result = await googleSearchConsoleCliConfigCreate({ env: { USERPROFILE: directory } })
      expect(result).toMatchObject({
        success: true,
        data: {
          accessToken: "userprofile-token",
          baseUrl: "https://searchconsole.googleapis.com/webmasters/v3",
          urlInspectionBaseUrl: "https://searchconsole.googleapis.com/v1",
        },
      })
    } finally {
      await rm(directory, { force: true, recursive: true })
    }
  })

  it("loads credentials from GOOGLE_SEARCH_CONSOLE_CREDENTIALS_FILE", async () => {
    const directory = await mkdtemp(join(tmpdir(), "google-search-console-cli-"))
    const credentialsFile = join(directory, "credentials.json")
    await writeFile(
      credentialsFile,
      JSON.stringify({ mobileFriendlyApiKey: "override-key", baseUrl: "https://override.example.test" }),
    )

    try {
      const result = await googleSearchConsoleCliConfigCreate({
        env: { GOOGLE_SEARCH_CONSOLE_CREDENTIALS_FILE: credentialsFile },
      })
      expect(result).toEqual({
        success: true,
        data: {
          mobileFriendlyApiKey: "override-key",
          baseUrl: "https://override.example.test",
          urlInspectionBaseUrl: "https://searchconsole.googleapis.com/v1",
        },
      })
    } finally {
      await rm(directory, { force: true, recursive: true })
    }
  })

  it("ignores a missing implicit default credentials file", async () => {
    const directory = await mkdtemp(join(tmpdir(), "google-search-console-cli-"))

    try {
      const result = await googleSearchConsoleCliConfigCreate({
        env: { HOME: directory, GOOGLE_SEARCH_CONSOLE_ACCESS_TOKEN: "environment-token" },
      })
      expect(result).toEqual({
        success: true,
        data: {
          accessToken: "environment-token",
          baseUrl: "https://searchconsole.googleapis.com/webmasters/v3",
          urlInspectionBaseUrl: "https://searchconsole.googleapis.com/v1",
        },
      })
    } finally {
      await rm(directory, { force: true, recursive: true })
    }
  })

  it("rejects invalid explicit and existing default credentials files", async () => {
    const directory = await mkdtemp(join(tmpdir(), "google-search-console-cli-"))
    const explicitCredentialsFile = join(directory, "explicit-credentials.json")
    const defaultCredentialsDirectory = join(directory, ".config/google-search-console")
    await writeFile(explicitCredentialsFile, "{")
    await mkdir(defaultCredentialsDirectory, { recursive: true })
    await writeFile(join(defaultCredentialsDirectory, "credentials.json"), "{}")

    try {
      const explicitResult = await googleSearchConsoleCliConfigCreate({
        env: { GOOGLE_SEARCH_CONSOLE_CREDENTIALS_FILE: explicitCredentialsFile },
      })
      expect(explicitResult).toMatchObject({
        success: false,
        op: "googleSearchConsoleCliConfigCreate",
        errorMessage: expect.stringContaining(`Unable to parse credentials file "${explicitCredentialsFile}"`),
      })

      const defaultResult = await googleSearchConsoleCliConfigCreate({ env: { HOME: directory } })
      expect(defaultResult).toMatchObject({
        success: false,
        op: "googleSearchConsoleCliConfigCreate",
        errorMessage: expect.stringContaining(
          `Invalid credentials file "${join(defaultCredentialsDirectory, "credentials.json")}"`,
        ),
      })
    } finally {
      await rm(directory, { force: true, recursive: true })
    }
  })

  it("rejects incomplete OAuth credentials without exposing secrets in errors", async () => {
    const directory = await mkdtemp(join(tmpdir(), "google-search-console-cli-"))
    const nestedCredentialsFile = join(directory, "nested-credentials.json")
    const flatCredentialsFile = join(directory, "flat-credentials.json")
    const nestedSecret = "nested-client-secret-that-must-not-leak"
    const nestedRefreshToken = "nested-refresh-token-that-must-not-leak"
    const flatSecret = "flat-client-secret-that-must-not-leak"
    const flatRefreshToken = "flat-refresh-token-that-must-not-leak"
    await writeFile(
      nestedCredentialsFile,
      JSON.stringify({
        oauth: {
          clientSecret: nestedSecret,
          refreshToken: nestedRefreshToken,
        },
      }),
    )
    await writeFile(flatCredentialsFile, JSON.stringify({ client_secret: flatSecret, refresh_token: flatRefreshToken }))

    try {
      const nestedResult = await googleSearchConsoleCliConfigCreate({
        env: { GOOGLE_SEARCH_CONSOLE_CREDENTIALS_FILE: nestedCredentialsFile },
      })
      expect(nestedResult.success).toBe(false)
      expect(JSON.stringify(nestedResult)).not.toContain(nestedSecret)
      expect(JSON.stringify(nestedResult)).not.toContain(nestedRefreshToken)

      const flatResult = await googleSearchConsoleCliConfigCreate({
        env: { GOOGLE_SEARCH_CONSOLE_CREDENTIALS_FILE: flatCredentialsFile },
      })
      expect(flatResult.success).toBe(false)
      expect(JSON.stringify(flatResult)).not.toContain(flatSecret)
      expect(JSON.stringify(flatResult)).not.toContain(flatRefreshToken)

      const environmentSecret = "environment-client-secret-that-must-not-leak"
      const environmentRefreshToken = "environment-refresh-token-that-must-not-leak"
      const environmentResult = await googleSearchConsoleCliConfigCreate({
        env: {
          GOOGLE_SEARCH_CONSOLE_OAUTH_CLIENT_SECRET: environmentSecret,
          GOOGLE_SEARCH_CONSOLE_OAUTH_REFRESH_TOKEN: environmentRefreshToken,
        },
      })
      expect(environmentResult.success).toBe(false)
      expect(JSON.stringify(environmentResult)).not.toContain(environmentSecret)
      expect(JSON.stringify(environmentResult)).not.toContain(environmentRefreshToken)
    } finally {
      await rm(directory, { force: true, recursive: true })
    }
  })

  it("renders successful JSON and uses the OAuth flag over the environment", async () => {
    const authorization = { value: null as string | null }
    const server = Bun.serve({
      port: 0,
      fetch(request) {
        authorization.value = request.headers.get("Authorization")
        return Response.json({ siteEntry: [] })
      },
    })

    try {
      const result = await googleSearchConsoleCliRunResult(
        ["sites", "list", "--access-token", "flag-token", "--base-url", `http://127.0.0.1:${server.port}`],
        {
          GOOGLE_SEARCH_CONSOLE_ACCESS_TOKEN: "environment-token",
        },
      )
      expect(result.exitCode).toBe(0)
      expect(result.stderr).toBe("")
      expect(JSON.parse(result.stdout)).toEqual({ success: true, data: { siteEntry: [] } })
      expect(authorization.value).toBe("Bearer flag-token")
    } finally {
      server.stop()
    }
  })

  it("renders Result errors and exits nonzero for missing credentials and invalid flags", async () => {
    const missing = await googleSearchConsoleCliRunResult(["sites", "list"], {})
    expect(missing.exitCode).toBe(1)
    expect(missing.stdout).toBe("")
    expect(JSON.parse(missing.stderr)).toMatchObject({
      success: false,
      op: "googleSearchConsoleCliConfigCreate",
    })

    const invalid = await googleSearchConsoleCliRunResult(
      ["search-analytics", "query", "https://example.com/", "2026-08-01", "2026-08-02", "--start-row", "not-a-number"],
      { GOOGLE_SEARCH_CONSOLE_ACCESS_TOKEN: "token" },
    )
    expect(invalid.exitCode).toBe(1)
    expect(invalid.stdout).toBe("")
    expect(JSON.parse(invalid.stderr)).toMatchObject({ success: false, op: "cliArgumentParse" })
  })

  it("renders structured API errors on stderr", async () => {
    const server = Bun.serve({
      port: 0,
      fetch() {
        return Response.json(
          {
            error: {
              code: 403,
              message: "The caller does not have permission.",
              status: "PERMISSION_DENIED",
            },
          },
          { status: 403, statusText: "Forbidden" },
        )
      },
    })

    try {
      const result = await googleSearchConsoleCliRunResult(
        ["sites", "list", "--access-token", "token", "--base-url", `http://127.0.0.1:${server.port}`],
        {},
      )
      expect(result.exitCode).toBe(1)
      expect(result.stdout).toBe("")
      expect(JSON.parse(result.stderr)).toMatchObject({
        success: false,
        op: "sitesList",
        statusCode: 403,
        errorMessage: "The caller does not have permission.",
      })
    } finally {
      server.stop()
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
