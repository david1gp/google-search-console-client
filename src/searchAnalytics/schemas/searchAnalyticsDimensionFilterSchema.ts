import * as v from "valibot"

export const searchAnalyticsDimensionFilterSchema = v.object({
  dimension: v.picklist(["country", "device", "page", "query", "searchAppearance"]),
  expression: v.string(),
  operator: v.picklist(["contains", "equals", "excludingRegex", "includingRegex", "notContains", "notEquals"]),
})

export type SearchAnalyticsDimensionFilter = v.InferOutput<typeof searchAnalyticsDimensionFilterSchema>
