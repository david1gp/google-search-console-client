import * as v from "valibot"
import { searchAnalyticsDimensionFilterSchema } from "./searchAnalyticsDimensionFilterSchema.js"

/**
 * A Search Analytics dimension filter group. `filters` may be omitted or empty, and Google defaults
 * an omitted `groupType` to `and`.
 *
 * @example
 * const group = v.parse(searchAnalyticsDimensionFilterGroupSchema, {
 *   filters: [{ dimension: "query", expression: "shoes" }],
 * })
 */
export const searchAnalyticsDimensionFilterGroupSchema = v.strictObject({
  filters: v.optional(v.array(searchAnalyticsDimensionFilterSchema)),
  groupType: v.optional(v.literal("and")),
})

/**
 * A validated Search Analytics dimension filter group.
 *
 * @example
 * const group: SearchAnalyticsDimensionFilterGroup = {}
 */
export type SearchAnalyticsDimensionFilterGroup = v.InferOutput<typeof searchAnalyticsDimensionFilterGroupSchema>
