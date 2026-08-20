import * as v from "valibot"

export const mobileFriendlyTestStatusSchema = v.object({
  details: v.optional(v.string()),
  status: v.optional(v.picklist(["TEST_STATUS_UNSPECIFIED", "COMPLETE", "INTERNAL_ERROR", "PAGE_UNREACHABLE"])),
})

export type MobileFriendlyTestStatus = v.InferOutput<typeof mobileFriendlyTestStatusSchema>
