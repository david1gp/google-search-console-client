import * as v from "valibot"

/**
 * A Search Analytics dimension filter. Filter expressions may contain at most 4096 characters;
 * Google defaults an omitted `operator` to `equals`.
 *
 * @example
 * const filter = v.parse(searchAnalyticsDimensionFilterSchema, { dimension: "query", expression: "shoes" })
 */
export const searchAnalyticsDimensionFilterSchema = v.strictObject({
  dimension: v.picklist(["country", "device", "page", "query", "searchAppearance"]),
  expression: v.pipe(v.string(), v.maxLength(4096)),
  operator: v.optional(
    v.picklist(["contains", "equals", "excludingRegex", "includingRegex", "notContains", "notEquals"]),
  ),
})

/**
 * A validated Search Analytics dimension filter.
 *
 * @example
 * const filter: SearchAnalyticsDimensionFilter = {
 *   dimension: "page",
 *   expression: "/draft",
 *   operator: "contains",
 * }
 */
export type SearchAnalyticsDimensionFilter = v.InferOutput<typeof searchAnalyticsDimensionFilterSchema>
