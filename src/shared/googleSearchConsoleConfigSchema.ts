import * as v from "valibot"
import { googleSearchConsoleAccessTokenSchema } from "./googleSearchConsoleAccessTokenSchema.js"
import { googleSearchConsoleApiKeySchema } from "./googleSearchConsoleApiKeySchema.js"
import type { GoogleSearchConsoleFetch } from "./googleSearchConsoleFetch.js"
import { googleSearchConsoleOAuthConfigSchema } from "./googleSearchConsoleOAuthConfigSchema.js"
import { googleSearchConsoleUrlSchema } from "./googleSearchConsoleUrlSchema.js"

const googleSearchConsoleWebmastersBaseUrl = "https://searchconsole.googleapis.com/webmasters/v3"
const googleSearchConsoleV1BaseUrl = "https://searchconsole.googleapis.com/v1"

export const googleSearchConsoleConfigSchema = v.pipe(
  v.object({
    accessToken: v.optional(googleSearchConsoleAccessTokenSchema),
    mobileFriendlyApiKey: v.optional(googleSearchConsoleApiKeySchema),
    oauth: v.optional(googleSearchConsoleOAuthConfigSchema),
    baseUrl: v.optional(googleSearchConsoleUrlSchema, googleSearchConsoleWebmastersBaseUrl),
    urlInspectionBaseUrl: v.optional(googleSearchConsoleUrlSchema, googleSearchConsoleV1BaseUrl),
    fetch: v.optional(v.custom<GoogleSearchConsoleFetch>((value) => typeof value === "function")),
  }),
  v.check(
    (config) =>
      config.accessToken !== undefined || config.mobileFriendlyApiKey !== undefined || config.oauth !== undefined,
    "accessToken, oauth, or mobileFriendlyApiKey is required",
  ),
)

export type GoogleSearchConsoleConfig = v.InferOutput<typeof googleSearchConsoleConfigSchema>
export type GoogleSearchConsoleConfigInput = v.InferInput<typeof googleSearchConsoleConfigSchema>
