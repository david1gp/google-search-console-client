import * as v from "valibot"

export const urlInspectionAmpIssueSchema = v.object({
  severity: v.optional(v.picklist(["SEVERITY_UNSPECIFIED", "WARNING", "ERROR"])),
  issueMessage: v.optional(v.string()),
})

export type UrlInspectionAmpIssue = v.InferOutput<typeof urlInspectionAmpIssueSchema>
