import * as v from "valibot"
import { searchAnalyticsMetadataSchema } from "./searchAnalyticsMetadataSchema.js"
import { searchAnalyticsRowSchema } from "./searchAnalyticsRowSchema.js"

export const searchAnalyticsQueryResponseSchema = v.object({
  rows: v.optional(v.array(searchAnalyticsRowSchema)),
  responseAggregationType: v.optional(v.picklist(["AUTO", "BY_PROPERTY", "BY_PAGE", "BY_NEWS_SHOWCASE_PANEL"])),
  metadata: v.optional(searchAnalyticsMetadataSchema),
})

export type SearchAnalyticsQueryResponse = v.InferOutput<typeof searchAnalyticsQueryResponseSchema>
