import * as v from "valibot"
import { googleSearchConsoleSiteUrlSchema } from "../../shared/googleSearchConsoleSiteUrlSchema.js"

export const siteEntrySchema = v.object({
  siteUrl: v.optional(googleSearchConsoleSiteUrlSchema),
  permissionLevel: v.optional(
    v.picklist([
      "SITE_PERMISSION_LEVEL_UNSPECIFIED",
      "SITE_OWNER",
      "SITE_FULL_USER",
      "SITE_RESTRICTED_USER",
      "SITE_UNVERIFIED_USER",
    ]),
  ),
})

export type SiteEntry = v.InferOutput<typeof siteEntrySchema>
