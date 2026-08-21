import { describe, expect, it } from "bun:test"
import { createHash } from "node:crypto"
import { chmod, mkdir, mkdtemp, readFile, rm, stat, symlink, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import {
  googleSearchConsoleOAuthAuthorizationCodeExchange,
  googleSearchConsoleOAuthAuthorizationUrlCreate,
  googleSearchConsoleOAuthCallbackParse,
  googleSearchConsoleOAuthCredentialsPersist,
  googleSearchConsoleOAuthLoopbackListen,
  googleSearchConsoleOAuthPendingComplete,
  googleSearchConsoleOAuthPendingStateLoad,
  googleSearchConsoleOAuthPendingStatePersist,
  googleSearchConsoleOAuthPkceCreate,
  googleSearchConsoleOAuthScope,
  googleSearchConsoleOAuthStateCreate,
} from "../../src/index.js"

describe("Google Search Console OAuth authorization primitives", () => {
  it("creates PKCE values and a random state", () => {
    const pkceResult = googleSearchConsoleOAuthPkceCreate()
    const stateResult = googleSearchConsoleOAuthStateCreate()

    expect(pkceResult.success).toBe(true)
    expect(stateResult.success).toBe(true)
    if (!pkceResult.success || !stateResult.success) return

    expect(pkceResult.data.codeVerifier).toHaveLength(43)
    expect(pkceResult.data.codeChallenge).toBe(
      createHash("sha256").update(pkceResult.data.codeVerifier).digest().toString("base64url"),
    )
    expect(stateResult.data).toHaveLength(43)
  })

  it("creates an authorization URL with the exact Search Console scope", () => {
    const result = googleSearchConsoleOAuthAuthorizationUrlCreate({
      clientId: "client-id",
      codeChallenge: "code-challenge",
      redirectUri: "http://127.0.0.1:1234/callback",
      state: "state",
    })

    expect(result.success).toBe(true)
    if (!result.success) return
    const url = new URL(result.data)
    expect(url.searchParams.get("scope")).toBe(googleSearchConsoleOAuthScope)
    expect([...url.searchParams.keys()].sort()).toEqual([
      "access_type",
      "client_id",
      "code_challenge",
      "code_challenge_method",
      "prompt",
      "redirect_uri",
      "response_type",
      "scope",
      "state",
    ])
  })

  it("exchanges an authorization code without requiring a client secret", async () => {
    let requestInit: RequestInit | undefined
    const result = await googleSearchConsoleOAuthAuthorizationCodeExchange(
      async (_input, init) => {
        requestInit = init
        return new Response(
          JSON.stringify({
            access_token: "access-token",
            expires_in: 3600,
            refresh_token: "refresh-token",
            scope: googleSearchConsoleOAuthScope,
          }),
          { status: 200 },
        )
      },
      {
        clientId: "client-id",
        code: "code",
        codeVerifier: "code-verifier",
        redirectUri: "http://127.0.0.1:1234/callback",
      },
    )

    expect(result.success).toBe(true)
    expect(Object.fromEntries(new URLSearchParams(String(requestInit?.body)))).toEqual({
      client_id: "client-id",
      code: "code",
      code_verifier: "code-verifier",
      grant_type: "authorization_code",
      redirect_uri: "http://127.0.0.1:1234/callback",
    })
  })

  it("includes an optional client secret when exchanging an authorization code", async () => {
    let requestInit: RequestInit | undefined
    const result = await googleSearchConsoleOAuthAuthorizationCodeExchange(
      async (_input, init) => {
        requestInit = init
        return new Response(JSON.stringify({ access_token: "access-token", expires_in: 3600 }), { status: 200 })
      },
      {
        clientId: "client-id",
        clientSecret: "client-secret",
        code: "code",
        codeVerifier: "code-verifier",
        redirectUri: "http://127.0.0.1:1234/callback",
      },
    )

    expect(result.success).toBe(true)
    expect(Object.fromEntries(new URLSearchParams(String(requestInit?.body)))).toMatchObject({
      client_id: "client-id",
      client_secret: "client-secret",
    })
  })

  it("rejects malformed and unsuccessful token responses without exposing their bodies", async () => {
    const options = {
      clientId: "client-id",
      clientSecret: "client-secret",
      code: "authorization-code",
      codeVerifier: "code-verifier",
      redirectUri: "http://127.0.0.1:1234/callback",
    }
    const malformedResult = await googleSearchConsoleOAuthAuthorizationCodeExchange(
      async () => new Response('{"access_token":"returned-secret"}', { status: 200 }),
      options,
    )
    const unsuccessfulResult = await googleSearchConsoleOAuthAuthorizationCodeExchange(
      async () => new Response("provider-secret authorization-code client-secret", { status: 400 }),
      options,
    )

    expect(malformedResult.success).toBe(false)
    expect(unsuccessfulResult.success).toBe(false)
    expect(JSON.stringify(malformedResult)).not.toContain("returned-secret")
    expect(JSON.stringify(unsuccessfulResult)).not.toContain("provider-secret")
    expect(JSON.stringify(unsuccessfulResult)).not.toContain("client-secret")
  })

  it("persists pending state and credentials with private, atomic files", async () => {
    const directory = await mkdtemp(join(tmpdir(), "google-search-console-oauth-"))
    const pendingPath = join(directory, "state/pending.json")
    const credentialsPath = join(directory, "config/credentials.json")

    try {
      const pendingState = {
        clientId: "client-id",
        codeVerifier: "a".repeat(43),
        createdAt: Date.now(),
        redirectUri: "http://127.0.0.1:1234/callback",
        state: "state",
        tokenUrl: "https://oauth2.googleapis.com/token",
      }
      expect(await googleSearchConsoleOAuthPendingStatePersist(pendingPath, pendingState)).toEqual({
        success: true,
        data: undefined,
      })
      expect((await stat(pendingPath)).mode & 0o777).toBe(0o600)
      expect(await googleSearchConsoleOAuthPendingStateLoad(pendingPath)).toEqual({
        success: true,
        data: pendingState,
      })

      await mkdir(join(directory, "config"), { recursive: true })
      await writeFile(
        credentialsPath,
        JSON.stringify({
          accessToken: "preserve-token",
          baseUrl: "https://example.test",
          oauth: { clientId: "old-client-id", clientSecret: "old-secret", unrelated: true },
          client_secret: "old-secret",
        }),
      )
      expect(
        await googleSearchConsoleOAuthCredentialsPersist(credentialsPath, {
          clientId: "client-id",
          refreshToken: "refresh-token",
        }),
      ).toEqual({ success: true, data: undefined })
      expect((await stat(credentialsPath)).mode & 0o777).toBe(0o600)
      const credentials = JSON.parse(await readFile(credentialsPath, "utf8"))
      expect(credentials).toEqual({
        baseUrl: "https://example.test",
        client_id: "client-id",
        refresh_token: "refresh-token",
        token_uri: "https://oauth2.googleapis.com/token",
        oauth: {
          clientId: "client-id",
          refreshToken: "refresh-token",
          tokenUrl: "https://oauth2.googleapis.com/token",
          unrelated: true,
        },
      })

      expect(
        await googleSearchConsoleOAuthCredentialsPersist(credentialsPath, {
          clientId: "new-client-id",
        }),
      ).toEqual({ success: true, data: undefined })
      expect(JSON.parse(await readFile(credentialsPath, "utf8")).refresh_token).toBe("refresh-token")

      await chmod(pendingPath, 0o644)
      const insecureResult = await googleSearchConsoleOAuthPendingStateLoad(pendingPath)
      expect(insecureResult.success).toBe(false)
    } finally {
      await rm(directory, { force: true, recursive: true })
    }
  })

  it("rejects malformed, symlinked, and non-regular pending state files", async () => {
    const directory = await mkdtemp(join(tmpdir(), "google-search-console-oauth-"))
    const pendingPath = join(directory, "pending.json")
    const targetPath = join(directory, "target.json")
    const directoryPath = join(directory, "pending-directory")

    try {
      await writeFile(pendingPath, "not-json", { mode: 0o600 })
      expect((await googleSearchConsoleOAuthPendingStateLoad(pendingPath)).success).toBe(false)

      await writeFile(
        pendingPath,
        JSON.stringify({
          clientId: "client-id",
          codeVerifier: "a".repeat(43),
          createdAt: -1,
          redirectUri: "file:///unsafe",
          state: "state",
        }),
        { mode: 0o600 },
      )
      expect((await googleSearchConsoleOAuthPendingStateLoad(pendingPath)).success).toBe(false)

      await writeFile(targetPath, JSON.stringify({ state: "secret" }), { mode: 0o600 })
      await rm(pendingPath)
      await symlink(targetPath, pendingPath)
      expect((await googleSearchConsoleOAuthPendingStateLoad(pendingPath)).success).toBe(false)

      await mkdir(directoryPath)
      expect((await googleSearchConsoleOAuthPendingStateLoad(directoryPath)).success).toBe(false)
    } finally {
      await rm(directory, { force: true, recursive: true })
    }
  })

  it("rejects malformed existing credentials without replacing them", async () => {
    const directory = await mkdtemp(join(tmpdir(), "google-search-console-oauth-"))
    const credentialsPath = join(directory, "credentials.json")

    try {
      await writeFile(credentialsPath, "not-json", { mode: 0o600 })
      const result = await googleSearchConsoleOAuthCredentialsPersist(credentialsPath, {
        clientId: "client-id",
        refreshToken: "refresh-token",
      })

      expect(result.success).toBe(false)
      expect(await readFile(credentialsPath, "utf8")).toBe("not-json")
    } finally {
      await rm(directory, { force: true, recursive: true })
    }
  })

  it("expires pending state after fifteen minutes and removes it before completion", async () => {
    const directory = await mkdtemp(join(tmpdir(), "google-search-console-oauth-"))
    const pendingPath = join(directory, "pending.json")
    const credentialsPath = join(directory, "credentials.json")
    const expiredState = {
      clientId: "client-id",
      codeVerifier: "a".repeat(43),
      createdAt: Date.now() - 15 * 60 * 1_000 - 1,
      redirectUri: "http://127.0.0.1:1234/oauth2/callback",
      state: "state",
      tokenUrl: "https://oauth.example.test/token",
    }

    try {
      await googleSearchConsoleOAuthPendingStatePersist(pendingPath, expiredState)
      const loadResult = await googleSearchConsoleOAuthPendingStateLoad(pendingPath)
      expect(loadResult).toMatchObject({ success: false, errorMessage: "Pending OAuth state has expired" })
      await expect(stat(pendingPath)).rejects.toMatchObject({ code: "ENOENT" })

      await googleSearchConsoleOAuthPendingStatePersist(pendingPath, expiredState)
      let exchanged = false
      const completeResult = await googleSearchConsoleOAuthPendingComplete(
        async () => {
          exchanged = true
          return new Response("should not exchange")
        },
        {
          callbackUrl: "http://127.0.0.1:1234/oauth2/callback?code=code&state=state",
          credentialsPath,
          pendingStatePath: pendingPath,
        },
      )
      expect(completeResult).toMatchObject({ success: false, errorMessage: "Pending OAuth state has expired" })
      expect(exchanged).toBe(false)
      await expect(stat(pendingPath)).rejects.toMatchObject({ code: "ENOENT" })
    } finally {
      await rm(directory, { force: true, recursive: true })
    }
  })

  it("validates callback origin, path, state, shape, and granted scope", () => {
    const options = {
      redirectUri: "http://127.0.0.1:1234/oauth2/callback",
      state: "state",
    }
    const validResult = googleSearchConsoleOAuthCallbackParse({
      ...options,
      callbackUrl:
        "http://127.0.0.1:1234/oauth2/callback?code=authorization-code&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fwebmasters&state=state",
    })

    expect(validResult).toEqual({
      success: true,
      data: {
        code: "authorization-code",
        error: undefined,
        errorDescription: undefined,
        scope: googleSearchConsoleOAuthScope,
        state: "state",
      },
    })

    for (const callbackUrl of [
      "http://localhost:1234/oauth2/callback?code=code&state=state",
      "http://127.0.0.1:1235/oauth2/callback?code=code&state=state",
      "http://127.0.0.1:1234/wrong?code=code&state=state",
      "http://127.0.0.1:1234/oauth2/callback?code=code&state=wrong",
      "http://127.0.0.1:1234/oauth2/callback?code=code&error=access_denied&state=state",
      "http://127.0.0.1:1234/oauth2/callback?state=state",
    ]) {
      expect(googleSearchConsoleOAuthCallbackParse({ ...options, callbackUrl }).success).toBe(false)
    }

    expect(
      googleSearchConsoleOAuthCallbackParse({
        ...options,
        callbackUrl: "http://127.0.0.1:1234/oauth2/callback?error=access_denied&state=state",
      }),
    ).toEqual({
      success: true,
      data: {
        code: undefined,
        error: "access_denied",
        errorDescription: undefined,
        scope: undefined,
        state: "state",
      },
    })
  })

  it("completes a code exchange, preserves omitted refresh tokens, and cleans up only after success", async () => {
    const directory = await mkdtemp(join(tmpdir(), "google-search-console-oauth-"))
    const pendingPath = join(directory, "pending.json")
    const credentialsPath = join(directory, "credentials.json")
    const pendingState = {
      clientId: "client-id",
      codeVerifier: "a".repeat(43),
      createdAt: Date.now(),
      redirectUri: "http://127.0.0.1:1234/oauth2/callback",
      state: "state",
      tokenUrl: "https://oauth.example.test/token",
    }

    try {
      expect(await googleSearchConsoleOAuthPendingStatePersist(pendingPath, pendingState)).toEqual({
        success: true,
        data: undefined,
      })
      await writeFile(credentialsPath, JSON.stringify({ refresh_token: "existing-refresh-token" }), { mode: 0o600 })

      let requestBody = ""
      let requestUrl = ""
      const result = await googleSearchConsoleOAuthPendingComplete(
        async (input, init) => {
          requestUrl = String(input)
          requestBody = String(init?.body)
          return new Response(
            JSON.stringify({
              access_token: "access-token",
              expires_in: 3600,
              scope: googleSearchConsoleOAuthScope,
            }),
            { status: 200 },
          )
        },
        {
          callbackUrl: "http://127.0.0.1:1234/oauth2/callback?code=authorization-code&state=state",
          credentialsPath,
          pendingStatePath: pendingPath,
        },
      )

      expect(result).toEqual({ success: true, data: undefined })
      expect(Object.fromEntries(new URLSearchParams(requestBody))).toMatchObject({
        code: "authorization-code",
        code_verifier: pendingState.codeVerifier,
      })
      expect(requestUrl).toBe("https://oauth.example.test/token")
      expect(JSON.parse(await readFile(credentialsPath, "utf8")).refresh_token).toBe("existing-refresh-token")
      expect(JSON.parse(await readFile(credentialsPath, "utf8")).token_uri).toBe("https://oauth.example.test/token")
      await expect(stat(pendingPath)).rejects.toMatchObject({ code: "ENOENT" })
    } finally {
      await rm(directory, { force: true, recursive: true })
    }
  })

  it("keeps pending state for invalid callbacks and exchange failures, but removes terminal provider errors and scope failures", async () => {
    const directory = await mkdtemp(join(tmpdir(), "google-search-console-oauth-"))
    const pendingPath = join(directory, "pending.json")
    const credentialsPath = join(directory, "credentials.json")
    const pendingState = {
      clientId: "client-id",
      codeVerifier: "a".repeat(43),
      createdAt: Date.now(),
      redirectUri: "http://127.0.0.1:1234/oauth2/callback",
      state: "state",
      tokenUrl: "https://oauth2.googleapis.com/token",
    }

    try {
      await googleSearchConsoleOAuthPendingStatePersist(pendingPath, pendingState)
      const invalidCallbackResult = await googleSearchConsoleOAuthPendingComplete(
        async () => {
          throw new Error("must not exchange an invalid callback")
        },
        {
          callbackUrl: "http://127.0.0.1:1234/oauth2/callback?code=code&state=wrong",
          credentialsPath,
          pendingStatePath: pendingPath,
        },
      )
      expect(invalidCallbackResult.success).toBe(false)
      expect((await googleSearchConsoleOAuthPendingStateLoad(pendingPath)).success).toBe(true)

      const exchangeFailureResult = await googleSearchConsoleOAuthPendingComplete(
        async () => new Response("temporary failure", { status: 503 }),
        {
          callbackUrl: "http://127.0.0.1:1234/oauth2/callback?code=code&state=state",
          credentialsPath,
          pendingStatePath: pendingPath,
        },
      )
      expect(exchangeFailureResult.success).toBe(false)
      expect((await googleSearchConsoleOAuthPendingStateLoad(pendingPath)).success).toBe(true)

      const providerErrorResult = await googleSearchConsoleOAuthPendingComplete(
        async () => {
          throw new Error("must not exchange a provider error")
        },
        {
          callbackUrl: "http://127.0.0.1:1234/oauth2/callback?error=access_denied&state=state",
          credentialsPath,
          pendingStatePath: pendingPath,
        },
      )
      expect(providerErrorResult.success).toBe(false)
      await expect(stat(pendingPath)).rejects.toMatchObject({ code: "ENOENT" })

      await googleSearchConsoleOAuthPendingStatePersist(pendingPath, pendingState)
      const scopeFailureResult = await googleSearchConsoleOAuthPendingComplete(
        async () =>
          new Response(
            JSON.stringify({
              access_token: "access-token",
              expires_in: 3600,
              scope: "https://www.googleapis.com/auth/webmasters.readonly",
            }),
            { status: 200 },
          ),
        {
          callbackUrl: "http://127.0.0.1:1234/oauth2/callback?code=code&state=state",
          credentialsPath,
          pendingStatePath: pendingPath,
        },
      )
      expect(scopeFailureResult.success).toBe(false)
      await expect(stat(pendingPath)).rejects.toMatchObject({ code: "ENOENT" })

      await googleSearchConsoleOAuthPendingStatePersist(pendingPath, pendingState)
      const callbackScopeFailureResult = await googleSearchConsoleOAuthPendingComplete(
        async () => {
          throw new Error("must not exchange a callback with an incomplete scope")
        },
        {
          callbackUrl:
            "http://127.0.0.1:1234/oauth2/callback?code=code&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fwebmasters.readonly&state=state",
          credentialsPath,
          pendingStatePath: pendingPath,
        },
      )
      expect(callbackScopeFailureResult.success).toBe(false)
      await expect(stat(pendingPath)).rejects.toMatchObject({ code: "ENOENT" })
    } finally {
      await rm(directory, { force: true, recursive: true })
    }
  })

  it("keeps the loopback listener alive after invalid callbacks and returns static responses", async () => {
    let receivedCallback: string | undefined
    const listenerResult = await googleSearchConsoleOAuthLoopbackListen({
      onCallback: async (callbackUrl) => {
        receivedCallback = callbackUrl
        return { success: true as const, data: "completed" }
      },
      state: "state",
      timeoutMs: 5_000,
    })

    expect(listenerResult.success).toBe(true)
    if (!listenerResult.success) return

    const listener = listenerResult.data
    try {
      const invalidResponse = await fetch(`${listener.redirectUri}?code=code&state=wrong`)
      expect(invalidResponse.status).toBe(400)
      expect(await invalidResponse.text()).toBe("Authorization callback rejected")
      expect(receivedCallback).toBeUndefined()

      const validResponse = await fetch(`${listener.redirectUri}?code=code&state=state`)
      expect(validResponse.status).toBe(200)
      expect(await validResponse.text()).toBe("Authorization complete. You may close this window.")
      expect(await listener.completed).toEqual({ success: true, data: "completed" })
      expect(receivedCallback).toContain("code=code")
    } finally {
      listener.stop()
    }
  })

  it("bounds the loopback listener lifetime", async () => {
    const listenerResult = await googleSearchConsoleOAuthLoopbackListen({
      onCallback: async () => ({ success: true as const, data: undefined }),
      state: "state",
      timeoutMs: 20,
    })

    expect(listenerResult.success).toBe(true)
    if (!listenerResult.success) return
    const result = await listenerResult.data.completed
    expect(result.success).toBe(false)
    listenerResult.data.stop()
  })
})
