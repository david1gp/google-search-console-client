import * as v from "valibot"
import { googleSearchConsoleSiteUrlSchema } from "../../shared/googleSearchConsoleSiteUrlSchema.js"

export const siteEntrySchema = v.object({
  siteUrl: v.optional(googleSearchConsoleSiteUrlSchema),
  permissionLevel: v.optional(v.picklist(["siteFullUser", "siteOwner", "siteRestrictedUser", "siteUnverifiedUser"])),
})

export type SiteEntry = v.InferOutput<typeof siteEntrySchema>
