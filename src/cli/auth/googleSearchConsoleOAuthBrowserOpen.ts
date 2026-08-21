import { spawn } from "node:child_process"
import { createResult, createResultError, type Result } from "#result"

type GoogleSearchConsoleOAuthBrowser = {
  readonly failure: Promise<ReturnType<typeof createResultError>>
}

export function googleSearchConsoleOAuthBrowserOpen(
  url: string,
  environment: Readonly<Record<string, string | undefined>> = {},
): Result<GoogleSearchConsoleOAuthBrowser> {
  const op = "googleSearchConsoleOAuthBrowserOpen"
  const command = googleSearchConsoleOAuthBrowserCommand(url)
  let child: ReturnType<typeof spawn>
  try {
    child = spawn(command[0], command.slice(1), {
      detached: true,
      env: googleSearchConsoleOAuthBrowserEnvironmentCreate(environment),
      shell: false,
      stdio: "ignore",
    })
  } catch {
    return createResultError(op, "Unable to launch the browser")
  }

  const failure = new Promise<ReturnType<typeof createResultError>>((resolve) => {
    let settled = false
    const fail = (message: string): void => {
      if (settled) return
      settled = true
      resolve(createResultError(op, message))
    }
    child.once("error", () => fail("Unable to launch the browser"))
    child.once("exit", (code, signal) => {
      if (code !== 0 || signal !== null) fail("The browser launcher failed")
    })
  })
  child.unref()
  return createResult({ failure })
}

function googleSearchConsoleOAuthBrowserCommand(url: string): [string, ...string[]] {
  if (process.platform === "darwin") return ["open", url]
  if (process.platform === "win32") return ["rundll32.exe", "url.dll,FileProtocolHandler", url]
  return ["xdg-open", url]
}

function googleSearchConsoleOAuthBrowserEnvironmentCreate(
  environment: Readonly<Record<string, string | undefined>>,
): Record<string, string> {
  const output: Record<string, string> = {}
  for (const [key, value] of Object.entries(process.env)) {
    if (value !== undefined) output[key] = value
  }
  for (const [key, value] of Object.entries(environment)) {
    if (value === undefined) delete output[key]
    else output[key] = value
  }
  return output
}
