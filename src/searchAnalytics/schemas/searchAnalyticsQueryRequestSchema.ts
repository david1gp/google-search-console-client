import * as v from "valibot"
import { googleSearchConsoleDateSchema } from "../../shared/googleSearchConsoleDateSchema.js"
import { googleSearchConsoleSiteUrlSchema } from "../../shared/googleSearchConsoleSiteUrlSchema.js"
import { searchAnalyticsDimensionFilterGroupSchema } from "./searchAnalyticsDimensionFilterGroupSchema.js"

const searchAnalyticsTypeSchema = v.picklist(["discover", "googleNews", "news", "image", "video", "web"])

/**
 * A Search Analytics query request. Dimensions must be unique; `rowLimit` is 1–25,000; and `startRow` is non-negative.
 * `type` is preferred, while deprecated `searchType` remains supported as an input alias. Parsed output contains only
 * `type`: a search-type-only input is normalized, matching values emit one value, and conflicting values are rejected.
 * When neither is supplied, `type` remains omitted so Google applies its web default.
 *
 * @example
 * const request = v.parse(searchAnalyticsQueryRequestSchema, {
 *   siteUrl: "https://example.com/",
 *   startDate: "2026-08-01",
 *   endDate: "2026-08-15",
 *   searchType: "web",
 * })
 */
export const searchAnalyticsQueryRequestSchema = v.pipe(
  v.strictObject({
    siteUrl: googleSearchConsoleSiteUrlSchema,
    startDate: googleSearchConsoleDateSchema,
    endDate: googleSearchConsoleDateSchema,
    dimensions: v.optional(
      v.pipe(
        v.array(v.picklist(["date", "query", "page", "country", "device", "searchAppearance", "hour"])),
        v.check((dimensions) => new Set(dimensions).size === dimensions.length, "dimensions must be unique"),
      ),
    ),
    type: v.optional(searchAnalyticsTypeSchema),
    searchType: v.optional(searchAnalyticsTypeSchema),
    dimensionFilterGroups: v.optional(v.array(searchAnalyticsDimensionFilterGroupSchema)),
    aggregationType: v.optional(v.picklist(["auto", "byNewsShowcasePanel", "byPage", "byProperty"])),
    startRow: v.optional(v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(2147483647))),
    rowLimit: v.optional(v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(25000))),
    dataState: v.optional(v.picklist(["all", "final", "hourly_all"])),
  }),
  v.check(({ startDate, endDate }) => startDate <= endDate, "startDate must be less than or equal to endDate"),
  v.check(
    ({ type, searchType }) => type === undefined || searchType === undefined || type === searchType,
    "type and searchType must match when both are supplied",
  ),
  v.transform(({ type, searchType, ...request }) => ({
    ...request,
    ...(type === undefined && searchType === undefined ? {} : { type: type ?? searchType }),
  })),
)

/**
 * A Search Analytics query request before schema parsing. Deprecated `searchType` is accepted as a compatibility input
 * alias and is normalized to `type` in the parsed output.
 *
 * @example
 * const request: SearchAnalyticsQueryRequestInput = {
 *   siteUrl: "https://example.com/",
 *   startDate: "2026-08-01",
 *   endDate: "2026-08-15",
 *   type: "web",
 * }
 */
export type SearchAnalyticsQueryRequestInput = v.InferInput<typeof searchAnalyticsQueryRequestSchema>

/**
 * A validated Search Analytics query request in canonical wire form. Deprecated `searchType` is not included in this
 * output type; callers of `searchAnalyticsQuery` may still supply it as a compatibility input.
 *
 * @example
 * const request: SearchAnalyticsQueryRequest = {
 *   siteUrl: "sc-domain:example.com",
 *   startDate: "2026-08-01",
 *   endDate: "2026-08-01",
 *   type: "web",
 * }
 */
export type SearchAnalyticsQueryRequest = v.InferOutput<typeof searchAnalyticsQueryRequestSchema>
