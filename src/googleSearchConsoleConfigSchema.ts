import * as v from "valibot"

export type FetchFunction = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>

export const googleSearchConsoleConfigSchema = v.object({
  accessToken: v.string(),
  baseUrl: v.optional(v.string(), "https://www.googleapis.com/webmasters/v3"),
  urlInspectionBaseUrl: v.optional(v.string(), "https://searchconsole.googleapis.com/v1"),
  fetch: v.optional(v.custom<FetchFunction>((val) => typeof val === "function")),
})

export type GoogleSearchConsoleConfig = v.InferOutput<typeof googleSearchConsoleConfigSchema>
