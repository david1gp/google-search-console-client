import * as v from "valibot"

export const sitemapContentSchema = v.object({
  type: v.optional(v.string()),
  submitted: v.optional(v.string()),
  indexed: v.optional(v.string()),
})

export const sitemapEntrySchema = v.object({
  path: v.string(),
  lastSubmitted: v.optional(v.string()),
  isPending: v.optional(v.boolean()),
  isSitemapsIndex: v.optional(v.boolean()),
  lastDownloaded: v.optional(v.string()),
  warnings: v.optional(v.string()),
  errors: v.optional(v.string()),
  contents: v.optional(v.array(sitemapContentSchema)),
})

export const sitemapsListResponseSchema = v.object({
  sitemap: v.optional(v.array(sitemapEntrySchema), []),
})

export type SitemapContent = v.InferOutput<typeof sitemapContentSchema>
export type SitemapEntry = v.InferOutput<typeof sitemapEntrySchema>
export type SitemapsListResponse = v.InferOutput<typeof sitemapsListResponseSchema>
