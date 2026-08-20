import * as v from "valibot"

export const mobileFriendlyTestIssueSchema = v.object({
  rule: v.optional(
    v.picklist([
      "MOBILE_FRIENDLY_RULE_UNSPECIFIED",
      "USES_INCOMPATIBLE_PLUGINS",
      "CONFIGURE_VIEWPORT",
      "FIXED_WIDTH_VIEWPORT",
      "SIZE_CONTENT_TO_VIEWPORT",
      "USE_LEGIBLE_FONT_SIZES",
      "TAP_TARGETS_TOO_CLOSE",
    ]),
  ),
})

export type MobileFriendlyTestIssue = v.InferOutput<typeof mobileFriendlyTestIssueSchema>
