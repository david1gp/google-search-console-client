import * as v from "valibot"

export const urlInspectionMobileUsabilityIssueSchema = v.object({
  message: v.optional(v.string()),
  severity: v.optional(v.picklist(["SEVERITY_UNSPECIFIED", "WARNING", "ERROR"])),
  issueType: v.optional(
    v.picklist([
      "MOBILE_USABILITY_ISSUE_TYPE_UNSPECIFIED",
      "USES_INCOMPATIBLE_PLUGINS",
      "CONFIGURE_VIEWPORT",
      "FIXED_WIDTH_VIEWPORT",
      "SIZE_CONTENT_TO_VIEWPORT",
      "USE_LEGIBLE_FONT_SIZES",
      "TAP_TARGETS_TOO_CLOSE",
    ]),
  ),
})

export type UrlInspectionMobileUsabilityIssue = v.InferOutput<typeof urlInspectionMobileUsabilityIssueSchema>
