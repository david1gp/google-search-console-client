import * as v from "valibot"
import { mobileFriendlyTestBlockedResourceSchema } from "./mobileFriendlyTestBlockedResourceSchema.js"

export const mobileFriendlyTestResourceIssueSchema = v.object({
  blockedResource: v.optional(mobileFriendlyTestBlockedResourceSchema),
})

export type MobileFriendlyTestResourceIssue = v.InferOutput<typeof mobileFriendlyTestResourceIssueSchema>
