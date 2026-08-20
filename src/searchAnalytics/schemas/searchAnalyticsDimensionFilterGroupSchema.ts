import * as v from "valibot"
import { searchAnalyticsDimensionFilterSchema } from "./searchAnalyticsDimensionFilterSchema.js"

export const searchAnalyticsDimensionFilterGroupSchema = v.object({
  filters: v.optional(v.array(searchAnalyticsDimensionFilterSchema)),
  groupType: v.optional(v.picklist(["AND"])),
})

export type SearchAnalyticsDimensionFilterGroup = v.InferOutput<typeof searchAnalyticsDimensionFilterGroupSchema>
