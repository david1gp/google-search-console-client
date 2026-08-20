import * as v from "valibot"
import { searchAnalyticsMetadataSchema } from "./searchAnalyticsMetadataSchema.js"
import { searchAnalyticsRowSchema } from "./searchAnalyticsRowSchema.js"

export const searchAnalyticsQueryResponseSchema = v.object({
  rows: v.optional(v.array(searchAnalyticsRowSchema)),
  responseAggregationType: v.optional(v.picklist(["auto", "byNewsShowcasePanel", "byPage", "byProperty"])),
  metadata: v.optional(searchAnalyticsMetadataSchema),
})

export type SearchAnalyticsQueryResponse = v.InferOutput<typeof searchAnalyticsQueryResponseSchema>
