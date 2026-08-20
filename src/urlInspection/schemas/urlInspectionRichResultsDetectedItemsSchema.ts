import * as v from "valibot"
import { urlInspectionRichResultsItemSchema } from "./urlInspectionRichResultsItemSchema.js"

export const urlInspectionRichResultsDetectedItemsSchema = v.object({
  richResultType: v.optional(v.string()),
  items: v.optional(v.array(urlInspectionRichResultsItemSchema)),
})

export type UrlInspectionRichResultsDetectedItems = v.InferOutput<typeof urlInspectionRichResultsDetectedItemsSchema>
