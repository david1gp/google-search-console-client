import * as v from "valibot"
import { googleSearchConsoleAccessTokenSchema } from "../../shared/googleSearchConsoleAccessTokenSchema.js"
import { googleSearchConsoleUrlSchema } from "../../shared/googleSearchConsoleUrlSchema.js"
import { googleSearchConsoleCliProfileNameSchema } from "../googleSearchConsoleCliProfileNameSchema.js"

export const googleSearchConsoleOAuthPendingStateSchema = v.object({
  clientId: googleSearchConsoleAccessTokenSchema,
  clientSecret: v.optional(googleSearchConsoleAccessTokenSchema),
  codeVerifier: v.pipe(v.string(), v.minLength(43), v.maxLength(128)),
  createdAt: v.pipe(v.number(), v.integer(), v.minValue(0)),
  profile: v.optional(googleSearchConsoleCliProfileNameSchema),
  redirectUri: googleSearchConsoleUrlSchema,
  state: googleSearchConsoleAccessTokenSchema,
  tokenUrl: v.optional(googleSearchConsoleUrlSchema, "https://oauth2.googleapis.com/token"),
})

export type GoogleSearchConsoleOAuthPendingState = v.InferOutput<typeof googleSearchConsoleOAuthPendingStateSchema>
