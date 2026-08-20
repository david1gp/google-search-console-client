import * as v from "valibot"
import { urlInspectionRichResultsIssueSchema } from "./urlInspectionRichResultsIssueSchema.js"

export const urlInspectionRichResultsItemSchema = v.object({
  name: v.optional(v.string()),
  issues: v.optional(v.array(urlInspectionRichResultsIssueSchema)),
})

export type UrlInspectionRichResultsItem = v.InferOutput<typeof urlInspectionRichResultsItemSchema>
