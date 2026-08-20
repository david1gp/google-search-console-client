import * as v from "valibot"
import { sitemapEntrySchema } from "./sitemapEntrySchema.js"

export const sitemapsListResponseSchema = v.object({
  sitemap: v.optional(v.array(sitemapEntrySchema)),
})

export type SitemapsListResponse = v.InferOutput<typeof sitemapsListResponseSchema>
