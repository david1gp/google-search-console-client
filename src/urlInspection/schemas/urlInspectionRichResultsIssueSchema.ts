import * as v from "valibot"

export const urlInspectionRichResultsIssueSchema = v.object({
  severity: v.optional(v.picklist(["SEVERITY_UNSPECIFIED", "WARNING", "ERROR"])),
  issueMessage: v.optional(v.string()),
})

export type UrlInspectionRichResultsIssue = v.InferOutput<typeof urlInspectionRichResultsIssueSchema>
