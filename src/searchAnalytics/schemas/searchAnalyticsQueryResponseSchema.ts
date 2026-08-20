import * as v from "valibot"
import { searchAnalyticsMetadataSchema } from "./searchAnalyticsMetadataSchema.js"
import { searchAnalyticsRowSchema } from "./searchAnalyticsRowSchema.js"

/**
 * Search Analytics query response. Google may omit `rows` when there are no matching rows; unknown response fields are
 * preserved for forward compatibility and typed as `unknown`.
 *
 * @example
 * const response = v.parse(searchAnalyticsQueryResponseSchema, { rows: [] })
 */
export const searchAnalyticsQueryResponseSchema = v.looseObject({
  rows: v.optional(v.array(searchAnalyticsRowSchema)),
  responseAggregationType: v.optional(v.picklist(["auto", "byNewsShowcasePanel", "byPage", "byProperty"])),
  metadata: v.optional(searchAnalyticsMetadataSchema),
})

/**
 * A validated Search Analytics query response. `rows` may be omitted when there is no data.
 *
 * @example
 * const response: SearchAnalyticsQueryResponse = { responseAggregationType: "byPage" }
 */
export type SearchAnalyticsQueryResponse = v.InferOutput<typeof searchAnalyticsQueryResponseSchema>
