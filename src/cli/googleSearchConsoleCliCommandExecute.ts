import { createResultError, type Result } from "#result"
import type { GoogleSearchConsoleClient } from "../shared/GoogleSearchConsoleClient.js"
import { googleSearchConsoleClientCreate } from "../shared/googleSearchConsoleClientCreate.js"
import {
  type GoogleSearchConsoleCliConfigCreateOptions,
  googleSearchConsoleCliConfigCreate,
} from "./googleSearchConsoleCliConfigCreate.js"
import { googleSearchConsoleCliResultWrite } from "./googleSearchConsoleCliResultWrite.js"
import type { GoogleSearchConsoleCommandContext } from "./googleSearchConsoleCommandContext.js"

type GoogleSearchConsoleCliCommandExecuteOptions<TResult> = {
  readonly clientInput: GoogleSearchConsoleCliConfigCreateOptions
  readonly execute: (client: GoogleSearchConsoleClient) => Result<TResult> | Promise<Result<TResult>>
  readonly op: string
}

export async function googleSearchConsoleCliCommandExecute<TResult>(
  context: GoogleSearchConsoleCommandContext,
  options: GoogleSearchConsoleCliCommandExecuteOptions<TResult>,
): Promise<void> {
  if (context.client !== undefined) {
    await googleSearchConsoleCliCommandExecuteWithClient(context, context.client, options)
    return
  }

  const configResult = await googleSearchConsoleCliConfigCreate({
    ...options.clientInput,
    env: context.process.env,
  })
  if (!configResult.success) {
    googleSearchConsoleCliResultWrite(context.process, configResult)
    return
  }

  const clientResult = googleSearchConsoleClientCreate(configResult.data)
  if (!clientResult.success) {
    googleSearchConsoleCliResultWrite(context.process, clientResult)
    return
  }

  await googleSearchConsoleCliCommandExecuteWithClient(context, clientResult.data, options)
}

async function googleSearchConsoleCliCommandExecuteWithClient<TResult>(
  context: GoogleSearchConsoleCommandContext,
  client: GoogleSearchConsoleClient,
  options: GoogleSearchConsoleCliCommandExecuteOptions<TResult>,
): Promise<void> {
  let result: Result<TResult>
  try {
    result = await options.execute(client)
  } catch (error) {
    result = createResultError(options.op, error instanceof Error ? error.message : String(error))
  }
  googleSearchConsoleCliResultWrite(context.process, result)
}
