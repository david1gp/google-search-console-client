import * as v from "valibot"

export const siteEntrySchema = v.object({
  siteUrl: v.string(),
  permissionLevel: v.string(),
})

export const sitesListResponseSchema = v.object({
  siteEntry: v.optional(v.array(siteEntrySchema), []),
})

export type SiteEntry = v.InferOutput<typeof siteEntrySchema>
export type SitesListResponse = v.InferOutput<typeof sitesListResponseSchema>
