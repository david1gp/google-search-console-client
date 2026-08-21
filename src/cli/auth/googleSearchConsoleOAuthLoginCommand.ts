import { randomInt } from "node:crypto"
import { dirname, join } from "node:path"
import { buildCommand } from "@stricli/core"
import { createResult, createResultError, type Result } from "#result"
import type { GoogleSearchConsoleCliEnvironment } from "../googleSearchConsoleCliConfigCreate.js"
import {
  googleSearchConsoleCliOAuthClientConfigResolve,
  googleSearchConsoleCliProfileCredentialsFilePathResolve,
} from "../googleSearchConsoleCliConfigCreate.js"
import type { GoogleSearchConsoleOAuthLoginFlags } from "../googleSearchConsoleCliFlags.js"
import { googleSearchConsoleOAuthLoginOptions } from "../googleSearchConsoleCliOptions.js"
import { googleSearchConsoleCliResultWrite } from "../googleSearchConsoleCliResultWrite.js"
import type { GoogleSearchConsoleCommandContext } from "../googleSearchConsoleCommandContext.js"
import { googleSearchConsoleOAuthAuthorizationUrlCreate } from "./googleSearchConsoleOAuthAuthorizationUrlCreate.js"
import { googleSearchConsoleOAuthBrowserOpen } from "./googleSearchConsoleOAuthBrowserOpen.js"
import { googleSearchConsoleOAuthLoopbackListen } from "./googleSearchConsoleOAuthLoopbackListen.js"
import { googleSearchConsoleOAuthPendingComplete } from "./googleSearchConsoleOAuthPendingComplete.js"
import { googleSearchConsoleOAuthPendingStatePersist } from "./googleSearchConsoleOAuthPendingStatePersist.js"
import { googleSearchConsoleOAuthPkceCreate } from "./googleSearchConsoleOAuthPkceCreate.js"
import { googleSearchConsoleOAuthStateCreate } from "./googleSearchConsoleOAuthStateCreate.js"

const googleSearchConsoleOAuthPendingStateFileName = ".oauth-pending.json"
const googleSearchConsoleOAuthDefaultTokenUrl = "https://oauth2.googleapis.com/token"

type GoogleSearchConsoleOAuthLoginHandoff = {
  readonly authorizationUrl: string
  readonly callbackUrl: string
  readonly credentialsFile: string
  readonly completionCommand: string
  readonly instructions: readonly string[]
  readonly pendingStateFile: string
  readonly profile: string
  readonly status: "pending"
}

type GoogleSearchConsoleOAuthLoginSuccess = {
  readonly credentialsFile: string
  readonly status: "authorized"
}

export const googleSearchConsoleOAuthLoginCommand = buildCommand<
  GoogleSearchConsoleOAuthLoginFlags,
  [],
  GoogleSearchConsoleCommandContext
>({
  func: async function (flags) {
    await googleSearchConsoleOAuthLoginCommandExecute(this, flags)
  },
  parameters: {
    flags: googleSearchConsoleOAuthLoginOptions,
  },
  docs: {
    brief: "Authorize Search Console with OAuth",
  },
})

async function googleSearchConsoleOAuthLoginCommandExecute(
  context: GoogleSearchConsoleCommandContext,
  flags: GoogleSearchConsoleOAuthLoginFlags,
): Promise<void> {
  const op = "googleSearchConsoleOAuthLogin"
  const environment = context.process.env ?? {}
  const credentialsFileResult = googleSearchConsoleOAuthLoginCredentialsFileResolve(flags, environment)
  if (!credentialsFileResult.success) {
    googleSearchConsoleCliResultWrite(context.process, credentialsFileResult)
    return
  }

  const credentialsFile = credentialsFileResult.data
  const pendingStateFile = googleSearchConsoleOAuthLoginPendingStateFileResolve(credentialsFile)
  if (flags.agent && flags.callbackUrl !== undefined) {
    googleSearchConsoleCliResultWrite(
      context.process,
      createResultError(op, "--agent and --callback-url cannot be used together"),
    )
    return
  }

  if (flags.callbackUrl !== undefined) {
    await googleSearchConsoleOAuthLoginCallbackComplete(
      context,
      flags,
      credentialsFile,
      pendingStateFile,
      flags.profile,
    )
    return
  }

  const clientConfigResult = await googleSearchConsoleCliOAuthClientConfigResolve({
    clientId: flags.clientId,
    clientSecret: flags.clientSecret,
    credentialsFile,
    env: environment,
    envFile: flags.envFile,
    profile: flags.profile,
  })
  if (!clientConfigResult.success) {
    googleSearchConsoleCliResultWrite(context.process, clientConfigResult)
    return
  }
  const clientId = clientConfigResult.data.clientId
  if (clientId === undefined || clientId.length === 0) {
    googleSearchConsoleCliResultWrite(context.process, createResultError(op, "OAuth client ID is required"))
    return
  }
  if (clientConfigResult.data.clientSecret === "") {
    googleSearchConsoleCliResultWrite(context.process, createResultError(op, "OAuth client secret cannot be empty"))
    return
  }

  const stateResult = googleSearchConsoleOAuthStateCreate()
  if (!stateResult.success) {
    googleSearchConsoleCliResultWrite(context.process, stateResult)
    return
  }
  const pkceResult = googleSearchConsoleOAuthPkceCreate()
  if (!pkceResult.success) {
    googleSearchConsoleCliResultWrite(context.process, pkceResult)
    return
  }

  if (flags.agent) {
    await googleSearchConsoleOAuthLoginAgentStart(
      context,
      clientId,
      clientConfigResult.data.clientSecret,
      clientConfigResult.data.tokenUrl,
      pkceResult.data.codeVerifier,
      pkceResult.data.codeChallenge,
      stateResult.data,
      credentialsFile,
      pendingStateFile,
      flags.profile ?? "default",
    )
    return
  }

  await googleSearchConsoleOAuthLoginBrowserStart(
    context,
    clientId,
    clientConfigResult.data.clientSecret,
    pkceResult.data.codeVerifier,
    pkceResult.data.codeChallenge,
    stateResult.data,
    clientConfigResult.data.tokenUrl,
    credentialsFile,
    pendingStateFile,
    flags.profile ?? "default",
  )
}

async function googleSearchConsoleOAuthLoginCallbackComplete(
  context: GoogleSearchConsoleCommandContext,
  flags: GoogleSearchConsoleOAuthLoginFlags,
  credentialsFile: string,
  pendingStateFile: string,
  profile: string | undefined,
): Promise<void> {
  const op = "googleSearchConsoleOAuthLogin"
  if (flags.callbackUrl === undefined || flags.callbackUrl.length === 0) {
    googleSearchConsoleCliResultWrite(context.process, createResultError(op, "--callback-url cannot be empty"))
    return
  }

  const completeResult = await googleSearchConsoleOAuthPendingComplete(fetch, {
    callbackUrl: flags.callbackUrl,
    credentialsPath: credentialsFile,
    pendingStatePath: pendingStateFile,
    profile,
  })
  if (!completeResult.success) {
    googleSearchConsoleCliResultWrite(context.process, completeResult)
    return
  }

  googleSearchConsoleCliResultWrite(context.process, googleSearchConsoleOAuthLoginSuccessCreate(credentialsFile))
}

async function googleSearchConsoleOAuthLoginAgentStart(
  context: GoogleSearchConsoleCommandContext,
  clientId: string,
  clientSecret: string | undefined,
  tokenUrl: string | undefined,
  codeVerifier: string,
  codeChallenge: string,
  state: string,
  credentialsFile: string,
  pendingStateFile: string,
  profile: string,
): Promise<void> {
  const redirectResult = await googleSearchConsoleOAuthLoginAgentRedirectUriCreate(state)
  if (!redirectResult.success) {
    googleSearchConsoleCliResultWrite(context.process, redirectResult)
    return
  }

  const pendingResult = await googleSearchConsoleOAuthLoginPendingStatePersist(
    pendingStateFile,
    clientId,
    clientSecret,
    tokenUrl ?? googleSearchConsoleOAuthDefaultTokenUrl,
    codeVerifier,
    state,
    redirectResult.data,
    profile,
  )
  if (!pendingResult.success) {
    googleSearchConsoleCliResultWrite(context.process, pendingResult)
    return
  }

  const authorizationUrlResult = googleSearchConsoleOAuthAuthorizationUrlCreate({
    clientId,
    codeChallenge,
    redirectUri: redirectResult.data,
    state,
  })
  if (!authorizationUrlResult.success) {
    googleSearchConsoleCliResultWrite(context.process, authorizationUrlResult)
    return
  }

  const handoff = googleSearchConsoleOAuthLoginHandoffCreate(
    authorizationUrlResult.data,
    redirectResult.data,
    credentialsFile,
    pendingStateFile,
    profile,
  )
  googleSearchConsoleCliResultWrite(context.process, createResult(handoff))
}

async function googleSearchConsoleOAuthLoginBrowserStart(
  context: GoogleSearchConsoleCommandContext,
  clientId: string,
  clientSecret: string | undefined,
  codeVerifier: string,
  codeChallenge: string,
  state: string,
  tokenUrl: string | undefined,
  credentialsFile: string,
  pendingStateFile: string,
  profile: string,
): Promise<void> {
  const op = "googleSearchConsoleOAuthLogin"
  const listenerResult = await googleSearchConsoleOAuthLoopbackListen({
    onCallback: (callbackUrl) =>
      googleSearchConsoleOAuthPendingComplete(fetch, {
        callbackUrl,
        credentialsPath: credentialsFile,
        pendingStatePath: pendingStateFile,
        profile,
      }),
    state,
  })
  if (!listenerResult.success) {
    googleSearchConsoleCliResultWrite(context.process, listenerResult)
    return
  }

  const listener = listenerResult.data
  const pendingResult = await googleSearchConsoleOAuthLoginPendingStatePersist(
    pendingStateFile,
    clientId,
    clientSecret,
    tokenUrl ?? googleSearchConsoleOAuthDefaultTokenUrl,
    codeVerifier,
    state,
    listener.redirectUri,
    profile,
  )
  if (!pendingResult.success) {
    listener.stop()
    googleSearchConsoleCliResultWrite(context.process, pendingResult)
    return
  }

  const authorizationUrlResult = googleSearchConsoleOAuthAuthorizationUrlCreate({
    clientId,
    codeChallenge,
    redirectUri: listener.redirectUri,
    state,
  })
  if (!authorizationUrlResult.success) {
    listener.stop()
    googleSearchConsoleCliResultWrite(context.process, authorizationUrlResult)
    return
  }

  const handoff = googleSearchConsoleOAuthLoginHandoffCreate(
    authorizationUrlResult.data,
    listener.redirectUri,
    credentialsFile,
    pendingStateFile,
    profile,
  )
  const browserResult = googleSearchConsoleOAuthBrowserOpen(authorizationUrlResult.data, context.process.env ?? {})
  if (!browserResult.success) {
    listener.stop()
    googleSearchConsoleCliResultWrite(
      context.process,
      googleSearchConsoleOAuthLoginResumableError(browserResult.errorMessage, handoff),
    )
    return
  }

  const result = await Promise.race([
    listener.completed,
    browserResult.data.failure.then((browserError) => {
      return googleSearchConsoleOAuthLoginResumableError(browserError.errorMessage, handoff)
    }),
  ])
  if (!result.success && result.op === op) listener.stop()
  if (!result.success) {
    googleSearchConsoleCliResultWrite(context.process, result)
    return
  }

  googleSearchConsoleCliResultWrite(context.process, googleSearchConsoleOAuthLoginSuccessCreate(credentialsFile))
}

function googleSearchConsoleOAuthLoginCredentialsFileResolve(
  flags: GoogleSearchConsoleOAuthLoginFlags,
  environment: GoogleSearchConsoleCliEnvironment,
): Result<string> {
  const op = "googleSearchConsoleOAuthLogin"
  const pathResult = googleSearchConsoleCliProfileCredentialsFilePathResolve(
    environment,
    flags.profile,
    true,
    flags.credentialsFile,
  )
  if (!pathResult.success) return createResultError(op, pathResult.errorMessage)
  const path = pathResult.data
  if (path === undefined || path.length === 0) return createResultError(op, "Credentials file path is required")
  return createResult(path)
}

function googleSearchConsoleOAuthLoginPendingStateFileResolve(credentialsFile: string): string {
  return join(dirname(credentialsFile), googleSearchConsoleOAuthPendingStateFileName)
}

function googleSearchConsoleOAuthLoginPendingStatePersist(
  path: string,
  clientId: string,
  clientSecret: string | undefined,
  tokenUrl: string | undefined,
  codeVerifier: string,
  state: string,
  redirectUri: string,
  profile: string,
) {
  return googleSearchConsoleOAuthPendingStatePersist(path, {
    clientId,
    clientSecret,
    codeVerifier,
    createdAt: Date.now(),
    profile,
    redirectUri,
    state,
    tokenUrl: tokenUrl ?? googleSearchConsoleOAuthDefaultTokenUrl,
  })
}

async function googleSearchConsoleOAuthLoginAgentRedirectUriCreate(state: string): Promise<Result<string>> {
  if (state.length === 0) return createResultError("googleSearchConsoleOAuthLogin", "Invalid OAuth state")
  const port = randomInt(49_152, 65_536)
  return createResult(`http://127.0.0.1:${port}/oauth2/callback`)
}

function googleSearchConsoleOAuthLoginHandoffCreate(
  authorizationUrl: string,
  callbackUrl: string,
  credentialsFile: string,
  pendingStateFile: string,
  profile: string,
): GoogleSearchConsoleOAuthLoginHandoff {
  const completionCommand = googleSearchConsoleOAuthLoginCompletionCommandCreate(credentialsFile, profile)
  return {
    authorizationUrl,
    callbackUrl,
    completionCommand,
    credentialsFile,
    instructions: [
      "Open the authorizationUrl in a browser.",
      "After authorization, the browser will show a failed loopback redirect; copy the complete redirect URL from the address bar.",
      "Replace PASTE_COMPLETE_LOOPBACK_REDIRECT_URL in completionCommand with that URL and run the command.",
    ],
    pendingStateFile,
    profile,
    status: "pending",
  }
}

function googleSearchConsoleOAuthLoginCompletionCommandCreate(credentialsFile: string, profile: string): string {
  return `google-search-console auth login --callback-url 'PASTE_COMPLETE_LOOPBACK_REDIRECT_URL' --credentials-file ${googleSearchConsoleOAuthLoginShellQuote(credentialsFile)} --profile ${googleSearchConsoleOAuthLoginShellQuote(profile)}`
}

function googleSearchConsoleOAuthLoginShellQuote(value: string): string {
  return `'${value.replaceAll("'", "'\\''")}'`
}

function googleSearchConsoleOAuthLoginResumableError(
  message: string,
  handoff: GoogleSearchConsoleOAuthLoginHandoff,
): ReturnType<typeof createResultError> {
  return createResultError("googleSearchConsoleOAuthLogin", message, JSON.stringify(handoff))
}

function googleSearchConsoleOAuthLoginSuccessCreate(
  credentialsFile: string,
): Result<GoogleSearchConsoleOAuthLoginSuccess> {
  return createResult({ credentialsFile, status: "authorized" })
}
