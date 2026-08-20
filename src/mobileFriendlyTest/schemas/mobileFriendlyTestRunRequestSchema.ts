import * as v from "valibot"
import { googleSearchConsoleUrlSchema } from "../../shared/googleSearchConsoleUrlSchema.js"

export const mobileFriendlyTestRunRequestSchema = v.object({
  url: googleSearchConsoleUrlSchema,
  requestScreenshot: v.optional(v.boolean()),
})

export type MobileFriendlyTestRunRequest = v.InferOutput<typeof mobileFriendlyTestRunRequestSchema>
