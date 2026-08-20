import * as v from "valibot"
import { urlInspectionRichResultsDetectedItemsSchema } from "./urlInspectionRichResultsDetectedItemsSchema.js"

export const urlInspectionRichResultsInspectionResultSchema = v.object({
  detectedItems: v.optional(v.array(urlInspectionRichResultsDetectedItemsSchema)),
  verdict: v.optional(v.picklist(["VERDICT_UNSPECIFIED", "PASS", "PARTIAL", "FAIL", "NEUTRAL"])),
})

export type UrlInspectionRichResultsInspectionResult = v.InferOutput<
  typeof urlInspectionRichResultsInspectionResultSchema
>
