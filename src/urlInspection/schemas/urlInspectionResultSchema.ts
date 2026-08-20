import * as v from "valibot"
import { urlInspectionAmpInspectionResultSchema } from "./urlInspectionAmpInspectionResultSchema.js"
import { urlInspectionItemSchema } from "./urlInspectionItemSchema.js"
import { urlInspectionMobileUsabilityInspectionResultSchema } from "./urlInspectionMobileUsabilityInspectionResultSchema.js"
import { urlInspectionRichResultsInspectionResultSchema } from "./urlInspectionRichResultsInspectionResultSchema.js"

export const urlInspectionResultSchema = v.object({
  inspectionResultLink: v.optional(v.string()),
  mobileUsabilityResult: v.optional(urlInspectionMobileUsabilityInspectionResultSchema),
  richResultsResult: v.optional(urlInspectionRichResultsInspectionResultSchema),
  ampResult: v.optional(urlInspectionAmpInspectionResultSchema),
  indexStatusResult: v.optional(urlInspectionItemSchema),
})

export type UrlInspectionResult = v.InferOutput<typeof urlInspectionResultSchema>
