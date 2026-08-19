import { createResult, createResultError, type Result } from "#result"
import * as v from "valibot"
import type { GoogleSearchConsoleClient } from "./googleSearchConsoleClientCreate.js"

export async function googleSearchConsoleRequest<TSchema extends v.BaseSchema<unknown, unknown, v.BaseIssue<unknown>>>(
  client: GoogleSearchConsoleClient,
  options: {
    op: string
    path: string
    method?: string
    body?: unknown
    schema: TSchema
    baseUrl?: string
  },
): Promise<Result<v.InferOutput<TSchema>>> {
  const { op, path, method = "GET", body, schema } = options
  const baseUrl = options.baseUrl ?? client.config.baseUrl
  const url = `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`

  const headers: Record<string, string> = {
    Authorization: `Bearer ${client.config.accessToken}`,
    Accept: "application/json",
  }

  if (body !== undefined) {
    headers["Content-Type"] = "application/json"
  }

  const fetchFn = client.config.fetch ?? fetch

  let response: Response
  try {
    response = await fetchFn(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch (err) {
    return createResultError(op, err instanceof Error ? err.message : String(err))
  }

  if (!response.ok) {
    let errorText = ""
    try {
      errorText = await response.text()
    } catch {
      errorText = response.statusText
    }
    return createResultError(op, `Request failed with status ${response.status}: ${errorText}`)
  }

  if (response.status === 204) {
    const parsed = v.safeParse(schema, undefined)
    if (!parsed.success) {
      return createResultError(op, `Failed to parse empty response: ${v.summarize(parsed.issues)}`)
    }
    return createResult(parsed.output)
  }

  let json: unknown
  try {
    json = await response.json()
  } catch (err) {
    return createResultError(op, `Invalid JSON response: ${err instanceof Error ? err.message : String(err)}`)
  }

  const parsed = v.safeParse(schema, json)
  if (!parsed.success) {
    return createResultError(op, `Schema validation failed: ${v.summarize(parsed.issues)}`)
  }

  return createResult(parsed.output)
}
