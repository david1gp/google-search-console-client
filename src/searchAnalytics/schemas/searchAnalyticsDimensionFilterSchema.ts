import * as v from "valibot"

export const searchAnalyticsDimensionFilterSchema = v.object({
  dimension: v.picklist(["QUERY", "PAGE", "COUNTRY", "DEVICE", "SEARCH_APPEARANCE"]),
  expression: v.string(),
  operator: v.picklist(["EQUALS", "NOT_EQUALS", "CONTAINS", "NOT_CONTAINS", "INCLUDING_REGEX", "EXCLUDING_REGEX"]),
})

export type SearchAnalyticsDimensionFilter = v.InferOutput<typeof searchAnalyticsDimensionFilterSchema>
