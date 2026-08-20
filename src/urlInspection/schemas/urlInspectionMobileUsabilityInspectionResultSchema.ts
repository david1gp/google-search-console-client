import * as v from "valibot"
import { urlInspectionMobileUsabilityIssueSchema } from "./urlInspectionMobileUsabilityIssueSchema.js"

export const urlInspectionMobileUsabilityInspectionResultSchema = v.object({
  verdict: v.optional(v.picklist(["VERDICT_UNSPECIFIED", "PASS", "PARTIAL", "FAIL", "NEUTRAL"])),
  issues: v.optional(v.array(urlInspectionMobileUsabilityIssueSchema)),
})

export type UrlInspectionMobileUsabilityInspectionResult = v.InferOutput<
  typeof urlInspectionMobileUsabilityInspectionResultSchema
>
