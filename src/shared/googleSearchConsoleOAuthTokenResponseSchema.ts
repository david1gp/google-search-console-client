import * as v from "valibot"
import { googleSearchConsoleAccessTokenSchema } from "./googleSearchConsoleAccessTokenSchema.js"

export const googleSearchConsoleOAuthTokenResponseSchema = v.object({
  access_token: googleSearchConsoleAccessTokenSchema,
  expires_in: v.pipe(v.number(), v.integer(), v.minValue(1)),
  refresh_token: v.optional(googleSearchConsoleAccessTokenSchema),
  token_type: v.optional(v.string()),
  scope: v.optional(v.string()),
})

export type GoogleSearchConsoleOAuthTokenResponse = v.InferOutput<typeof googleSearchConsoleOAuthTokenResponseSchema>
