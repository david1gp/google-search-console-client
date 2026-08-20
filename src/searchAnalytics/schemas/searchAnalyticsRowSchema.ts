import * as v from "valibot"

const searchAnalyticsMetricSchema = v.pipe(v.number(), v.finite())
const searchAnalyticsCtrSchema = v.pipe(searchAnalyticsMetricSchema, v.minValue(0), v.maxValue(1))

/**
 * A Search Analytics row. `clicks`, `impressions`, and `ctr` are required; metrics are finite and `ctr` is between 0
 * and 1. `keys` is omitted when the request has no dimensions; when present, values are positional and correspond to
 * the requested dimensions. `position` is omitted by Discover and Google News reports, but is finite when those report
 * types include it. Unknown response members are preserved and typed as `unknown`.
 *
 * @example
 * // dimensions: ["query", "country"] -> keys: ["shoes", "US"]
 * const row = v.parse(searchAnalyticsRowSchema, {
 *   keys: ["shoes", "US"],
 *   clicks: 12,
 *   impressions: 240,
 *   ctr: 0.05,
 *   position: 3.2,
 * })
 */
export const searchAnalyticsRowSchema = v.looseObject({
  keys: v.optional(v.array(v.string())),
  clicks: searchAnalyticsMetricSchema,
  impressions: searchAnalyticsMetricSchema,
  ctr: searchAnalyticsCtrSchema,
  position: v.optional(searchAnalyticsMetricSchema),
})

/**
 * A validated Search Analytics row. `keys` is optional for dimensionless queries, and `position` is optional because
 * Discover and Google News rows may omit it.
 *
 * @example
 * const row: SearchAnalyticsRow = { clicks: 12, impressions: 240, ctr: 0.05 }
 */
export type SearchAnalyticsRow = v.InferOutput<typeof searchAnalyticsRowSchema>
