import * as v from "valibot"
import { googleSearchConsoleDateSchema } from "../../shared/googleSearchConsoleDateSchema.js"
import { googleSearchConsoleSiteUrlSchema } from "../../shared/googleSearchConsoleSiteUrlSchema.js"
import { searchAnalyticsDimensionFilterGroupSchema } from "./searchAnalyticsDimensionFilterGroupSchema.js"

export const searchAnalyticsQueryRequestSchema = v.pipe(
  v.object({
    siteUrl: googleSearchConsoleSiteUrlSchema,
    startDate: googleSearchConsoleDateSchema,
    endDate: googleSearchConsoleDateSchema,
    dimensions: v.optional(
      v.array(v.picklist(["date", "query", "page", "country", "device", "searchAppearance", "hour"])),
    ),
    type: v.optional(v.picklist(["discover", "googleNews", "news", "image", "video", "web"])),
    searchType: v.optional(v.picklist(["discover", "googleNews", "news", "image", "video", "web"])),
    dimensionFilterGroups: v.optional(v.array(searchAnalyticsDimensionFilterGroupSchema)),
    aggregationType: v.optional(v.picklist(["auto", "byNewsShowcasePanel", "byPage", "byProperty"])),
    startRow: v.optional(v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(2147483647))),
    rowLimit: v.optional(v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(25000))),
    dataState: v.optional(v.picklist(["all", "final", "hourly_all"])),
  }),
  v.check(({ startDate, endDate }) => startDate <= endDate, "startDate must be less than or equal to endDate"),
)

export type SearchAnalyticsQueryRequest = v.InferOutput<typeof searchAnalyticsQueryRequestSchema>
