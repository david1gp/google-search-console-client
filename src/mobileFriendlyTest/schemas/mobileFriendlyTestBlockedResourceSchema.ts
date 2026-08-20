import * as v from "valibot"

export const mobileFriendlyTestBlockedResourceSchema = v.object({
  url: v.optional(v.string()),
})

export type MobileFriendlyTestBlockedResource = v.InferOutput<typeof mobileFriendlyTestBlockedResourceSchema>
