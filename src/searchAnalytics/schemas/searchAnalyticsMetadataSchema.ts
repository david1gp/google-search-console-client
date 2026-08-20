import * as v from "valibot"
import { googleSearchConsoleDateSchema } from "../../shared/googleSearchConsoleDateSchema.js"

const searchAnalyticsHourSchema = v.pipe(
  v.string(),
  v.regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:Z|[+-]\d{2}:\d{2})$/, "must use ISO-8601 date-time format"),
  v.check(
    (value) =>
      v.safeParse(googleSearchConsoleDateSchema, value.slice(0, 10)).success && !Number.isNaN(Date.parse(value)),
    "must be a valid date-time",
  ),
)

export const searchAnalyticsMetadataSchema = v.object({
  firstIncompleteDate: v.optional(googleSearchConsoleDateSchema),
  firstIncompleteHour: v.optional(searchAnalyticsHourSchema),
})

export type SearchAnalyticsMetadata = v.InferOutput<typeof searchAnalyticsMetadataSchema>
