import * as v from "valibot"
import { googleSearchConsoleAccessTokenSchema } from "./googleSearchConsoleAccessTokenSchema.js"
import { googleSearchConsoleUrlSchema } from "./googleSearchConsoleUrlSchema.js"

const googleSearchConsoleOAuthTokenUrl = "https://oauth2.googleapis.com/token"

export const googleSearchConsoleOAuthConfigSchema = v.object({
  clientId: googleSearchConsoleAccessTokenSchema,
  clientSecret: v.optional(googleSearchConsoleAccessTokenSchema),
  refreshToken: googleSearchConsoleAccessTokenSchema,
  tokenUrl: v.optional(googleSearchConsoleUrlSchema, googleSearchConsoleOAuthTokenUrl),
})

export type GoogleSearchConsoleOAuthConfig = v.InferOutput<typeof googleSearchConsoleOAuthConfigSchema>
export type GoogleSearchConsoleOAuthConfigInput = v.InferInput<typeof googleSearchConsoleOAuthConfigSchema>
