import * as v from "valibot"
import { googleSearchConsoleSiteUrlSchema } from "../../shared/googleSearchConsoleSiteUrlSchema.js"

/**
 * Validates a Search Console site entry response. Unknown response members are preserved and typed as `unknown`.
 *
 * @example
 * const entry = v.parse(siteEntrySchema, { siteUrl: "sc-domain:example.com", permissionLevel: "siteOwner" })
 */
export const siteEntrySchema = v.looseObject({
  siteUrl: googleSearchConsoleSiteUrlSchema,
  permissionLevel: v.picklist(["siteFullUser", "siteOwner", "siteRestrictedUser", "siteUnverifiedUser"]),
})

/**
 * A validated Search Console site entry.
 *
 * @example
 * const entry: SiteEntry = { siteUrl: "https://example.com/", permissionLevel: "siteFullUser" }
 */
export type SiteEntry = v.InferOutput<typeof siteEntrySchema>
