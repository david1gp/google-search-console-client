import * as v from "valibot"

export const searchAnalyticsRowSchema = v.object({
  keys: v.optional(v.array(v.string())),
  clicks: v.optional(v.number()),
  impressions: v.optional(v.number()),
  ctr: v.optional(v.number()),
  position: v.optional(v.number()),
})

export type SearchAnalyticsRow = v.InferOutput<typeof searchAnalyticsRowSchema>
