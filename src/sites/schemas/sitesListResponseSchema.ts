import * as v from "valibot"
import { siteEntrySchema } from "./siteEntrySchema.js"

/**
 * Validates the Sites list response; Google may omit `siteEntry` when the collection is empty. Unknown response
 * members are preserved and typed as `unknown`.
 *
 * @see https://developers.google.com/webmaster-tools/v1/sites
 * @see https://searchconsole.googleapis.com/$discovery/rest?version=v1
 *
 * @example
 * const sites = v.parse(sitesListResponseSchema, {}).siteEntry ?? []
 */
export const sitesListResponseSchema = v.looseObject({
  siteEntry: v.optional(v.array(siteEntrySchema)),
})

/**
 * A validated Sites list response.
 *
 * @example
 * const response: SitesListResponse = {
 *   siteEntry: [{ siteUrl: "https://example.com/", permissionLevel: "siteOwner" }],
 * }
 */
export type SitesListResponse = v.InferOutput<typeof sitesListResponseSchema>
