import * as v from "valibot"
import { siteEntrySchema } from "./siteEntrySchema.js"

export const sitesListResponseSchema = v.object({
  siteEntry: v.optional(v.array(siteEntrySchema)),
})

export type SitesListResponse = v.InferOutput<typeof sitesListResponseSchema>
