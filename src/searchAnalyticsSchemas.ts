import * as v from "valibot"

export const searchAnalyticsDimensionFilterSchema = v.object({
  dimension: v.picklist(["country", "device", "page", "query", "searchAppearance"]),
  operator: v.picklist(["contains", "equals", "notContains", "notEquals", "includingRegex", "excludingRegex"]),
  expression: v.string(),
})

export const searchAnalyticsDimensionFilterGroupSchema = v.object({
  groupType: v.optional(v.string(), "and"),
  filters: v.array(searchAnalyticsDimensionFilterSchema),
})

export const searchAnalyticsQueryRequestSchema = v.object({
  siteUrl: v.string(),
  startDate: v.string(),
  endDate: v.string(),
  dimensions: v.optional(v.array(v.picklist(["date", "query", "page", "country", "device", "searchAppearance"]))),
  type: v.optional(v.picklist(["web", "image", "video", "news", "discover", "googleNews"])),
  dimensionFilterGroups: v.optional(v.array(searchAnalyticsDimensionFilterGroupSchema)),
  aggregationType: v.optional(v.picklist(["auto", "byPage", "byProperty"])),
  rowLimit: v.optional(v.number()),
  startRow: v.optional(v.number()),
  dataState: v.optional(v.picklist(["all", "final"])),
})

export const searchAnalyticsRowSchema = v.object({
  keys: v.optional(v.array(v.string())),
  clicks: v.optional(v.number(), 0),
  impressions: v.optional(v.number(), 0),
  ctr: v.optional(v.number(), 0),
  position: v.optional(v.number(), 0),
})

export const searchAnalyticsQueryResponseSchema = v.object({
  rows: v.optional(v.array(searchAnalyticsRowSchema), []),
  responseAggregationType: v.optional(v.string()),
})

export type SearchAnalyticsDimensionFilter = v.InferOutput<typeof searchAnalyticsDimensionFilterSchema>
export type SearchAnalyticsDimensionFilterGroup = v.InferOutput<typeof searchAnalyticsDimensionFilterGroupSchema>
export type SearchAnalyticsQueryRequest = v.InferOutput<typeof searchAnalyticsQueryRequestSchema>
export type SearchAnalyticsRow = v.InferOutput<typeof searchAnalyticsRowSchema>
export type SearchAnalyticsQueryResponse = v.InferOutput<typeof searchAnalyticsQueryResponseSchema>
