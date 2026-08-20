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
      v.array(v.picklist(["DATE", "QUERY", "PAGE", "COUNTRY", "DEVICE", "SEARCH_APPEARANCE", "HOUR"])),
    ),
    type: v.optional(v.picklist(["WEB", "IMAGE", "VIDEO", "NEWS", "DISCOVER", "GOOGLE_NEWS"])),
    searchType: v.optional(v.picklist(["WEB", "IMAGE", "VIDEO", "NEWS", "DISCOVER", "GOOGLE_NEWS"])),
    dimensionFilterGroups: v.optional(v.array(searchAnalyticsDimensionFilterGroupSchema)),
    aggregationType: v.optional(v.picklist(["AUTO", "BY_PROPERTY", "BY_PAGE", "BY_NEWS_SHOWCASE_PANEL"])),
    startRow: v.optional(v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(2147483647))),
    rowLimit: v.optional(v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(25000))),
    dataState: v.optional(v.picklist(["DATA_STATE_UNSPECIFIED", "FINAL", "ALL", "HOURLY_ALL"])),
  }),
  v.check(({ startDate, endDate }) => startDate <= endDate, "startDate must be less than or equal to endDate"),
)

export type SearchAnalyticsQueryRequest = v.InferOutput<typeof searchAnalyticsQueryRequestSchema>
