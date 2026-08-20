import * as v from "valibot"
import { googleSearchConsoleDateSchema } from "../../shared/googleSearchConsoleDateSchema.js"
import { googleSearchConsoleDatetimeSchema } from "../../shared/googleSearchConsoleDatetimeSchema.js"

/**
 * Optional Search Analytics response metadata. The wire fields are camelCase, even though some Google documentation
 * describes them with snake_case names. Unknown response members are preserved and typed as `unknown`.
 *
 * @example
 * const metadata = v.parse(searchAnalyticsMetadataSchema, { firstIncompleteDate: "2026-08-14" })
 */
export const searchAnalyticsMetadataSchema = v.looseObject({
  firstIncompleteDate: v.optional(googleSearchConsoleDateSchema),
  firstIncompleteHour: v.optional(googleSearchConsoleDatetimeSchema),
})

/**
 * Validated optional Search Analytics response metadata.
 *
 * @example
 * const metadata: SearchAnalyticsMetadata = { firstIncompleteHour: "2026-08-14T12:00:00Z" }
 */
export type SearchAnalyticsMetadata = v.InferOutput<typeof searchAnalyticsMetadataSchema>
