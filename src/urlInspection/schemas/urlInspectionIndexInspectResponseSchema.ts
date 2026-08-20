import * as v from "valibot"
import { urlInspectionResultSchema } from "./urlInspectionResultSchema.js"

export const urlInspectionIndexInspectResponseSchema = v.object({
  inspectionResult: v.optional(urlInspectionResultSchema),
})

export type UrlInspectionIndexInspectResponse = v.InferOutput<typeof urlInspectionIndexInspectResponseSchema>
