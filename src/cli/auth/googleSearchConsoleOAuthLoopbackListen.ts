import { createServer, type Server, type ServerResponse } from "node:http"
import { createResult, createResultError, type Result } from "#result"
import type { GoogleSearchConsoleOAuthCallback } from "./googleSearchConsoleOAuthCallbackParse.js"
import { googleSearchConsoleOAuthCallbackParse } from "./googleSearchConsoleOAuthCallbackParse.js"

const googleSearchConsoleOAuthLoopbackHost = "127.0.0.1"
const googleSearchConsoleOAuthLoopbackDefaultPath = "/oauth2/callback"
const googleSearchConsoleOAuthLoopbackDefaultTimeoutMs = 120_000
const googleSearchConsoleOAuthLoopbackMaximumTimeoutMs = 300_000

export type GoogleSearchConsoleOAuthLoopbackListenOptions<T> = {
  readonly callbackPath?: string
  readonly onCallback: (callbackUrl: string, callback: GoogleSearchConsoleOAuthCallback) => Promise<Result<T>>
  readonly port?: number
  readonly state: string
  readonly timeoutMs?: number
}

export type GoogleSearchConsoleOAuthLoopbackListener<T> = {
  readonly completed: Promise<Result<T>>
  readonly redirectUri: string
  readonly stop: () => void
}

export async function googleSearchConsoleOAuthLoopbackListen<T>(
  options: GoogleSearchConsoleOAuthLoopbackListenOptions<T>,
): Promise<Result<GoogleSearchConsoleOAuthLoopbackListener<T>>> {
  const op = "googleSearchConsoleOAuthLoopbackListen"
  const pathResult = googleSearchConsoleOAuthLoopbackPathValidate(
    options.callbackPath ?? googleSearchConsoleOAuthLoopbackDefaultPath,
  )
  if (!pathResult.success) return pathResult
  if (options.state.length === 0) return createResultError(op, "Invalid OAuth state")

  const port = options.port ?? 0
  if (!Number.isInteger(port) || port < 0 || port > 65_535) return createResultError(op, "Invalid OAuth callback port")

  const timeoutMs = options.timeoutMs ?? googleSearchConsoleOAuthLoopbackDefaultTimeoutMs
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > googleSearchConsoleOAuthLoopbackMaximumTimeoutMs) {
    return createResultError(op, "Invalid OAuth callback timeout")
  }

  let resolveCompleted: ((result: Result<T>) => void) | undefined
  const completed = new Promise<Result<T>>((resolve) => {
    resolveCompleted = resolve
  })
  let server: Server | undefined
  let redirectUri = ""
  let timeout: ReturnType<typeof setTimeout> | undefined
  let stopped = false
  let callbackHandled = false

  const stop = (result: Result<T>, closeActiveConnections = false): void => {
    if (stopped) return
    stopped = true
    if (timeout !== undefined) clearTimeout(timeout)
    if (server !== undefined) {
      if (closeActiveConnections) server.closeAllConnections()
      server.close()
    }
    resolveCompleted?.(result)
  }

  server = createServer((request, response) => {
    void googleSearchConsoleOAuthLoopbackRequestHandle(
      request.method,
      request.url,
      response,
      redirectUri,
      options.state,
      () => callbackHandled,
      () => {
        callbackHandled = true
      },
      async () => {
        const callbackUrl = new URL(request.url ?? "/", redirectUri).toString()
        const callbackResult = googleSearchConsoleOAuthCallbackParse({
          callbackUrl,
          redirectUri,
          state: options.state,
        })
        if (!callbackResult.success) return callbackResult

        let completionResult: Result<T>
        try {
          completionResult = await options.onCallback(callbackUrl, callbackResult.data)
        } catch {
          completionResult = createResultError(op, "OAuth callback completion failed")
        }
        stop(completionResult)
        return completionResult
      },
    )
  })

  const listenResult = await googleSearchConsoleOAuthLoopbackServerListen(server, port)
  if (!listenResult.success) return listenResult
  redirectUri = `http://${googleSearchConsoleOAuthLoopbackHost}:${listenResult.data}${pathResult.data}`
  server.on("error", () => stop(createResultError(op, "OAuth callback listener failed"), true))
  timeout = setTimeout(() => stop(createResultError(op, "OAuth callback listener timed out"), true), timeoutMs)

  return createResult({
    completed,
    redirectUri,
    stop: () => stop(createResultError(op, "OAuth callback listener stopped"), true),
  })
}

async function googleSearchConsoleOAuthLoopbackServerListen(server: Server, port: number): Promise<Result<number>> {
  const op = "googleSearchConsoleOAuthLoopbackListen"
  return await new Promise((resolve) => {
    const onError = (): void => resolve(createResultError(op, "Unable to start OAuth callback listener"))
    server.once("error", onError)
    server.listen(port, googleSearchConsoleOAuthLoopbackHost, () => {
      server.off("error", onError)
      const address = server.address()
      if (address === null || typeof address === "string") {
        resolve(createResultError(op, "Unable to start OAuth callback listener"))
        return
      }
      resolve(createResult(address.port))
    })
  })
}

async function googleSearchConsoleOAuthLoopbackRequestHandle<T>(
  method: string | undefined,
  requestUrl: string | undefined,
  response: ServerResponse,
  redirectUri: string,
  state: string,
  callbackHandled: () => boolean,
  callbackMarkHandled: () => void,
  onValidCallback: () => Promise<Result<T>>,
): Promise<void> {
  if (method !== "GET") {
    googleSearchConsoleOAuthLoopbackResponse(response, 405, "Method not allowed")
    return
  }

  const callbackUrl = new URL(requestUrl ?? "/", redirectUri).toString()
  const callbackResult = googleSearchConsoleOAuthCallbackParse({ callbackUrl, redirectUri, state })
  if (!callbackResult.success) {
    googleSearchConsoleOAuthLoopbackResponse(response, 400, "Authorization callback rejected")
    return
  }
  if (callbackHandled()) {
    googleSearchConsoleOAuthLoopbackResponse(response, 409, "Authorization callback already received")
    return
  }

  callbackMarkHandled()
  const completionResult = await onValidCallback()
  googleSearchConsoleOAuthLoopbackResponse(
    response,
    completionResult.success ? 200 : 400,
    completionResult.success
      ? "Authorization complete. You may close this window."
      : "Authorization failed. You may close this window.",
  )
}

function googleSearchConsoleOAuthLoopbackPathValidate(path: string): Result<string> {
  const op = "googleSearchConsoleOAuthLoopbackListen"
  if (!path.startsWith("/") || path.includes("?") || path.includes("#")) {
    return createResultError(op, "Invalid OAuth callback path")
  }
  return createResult(path)
}

function googleSearchConsoleOAuthLoopbackResponse(response: ServerResponse, status: number, body: string): void {
  response.writeHead(status, {
    "Cache-Control": "no-store",
    "Content-Type": "text/plain; charset=utf-8",
  })
  response.end(body)
}
