import * as v from "valibot"
import { googleSearchConsoleDatetimeSchema } from "../../shared/googleSearchConsoleDatetimeSchema.js"
import { sitemapContentSchema } from "./sitemapContentSchema.js"

export const sitemapEntrySchema = v.object({
  path: v.optional(v.string()),
  lastSubmitted: v.optional(googleSearchConsoleDatetimeSchema),
  isPending: v.optional(v.boolean()),
  isSitemapsIndex: v.optional(v.boolean()),
  lastDownloaded: v.optional(googleSearchConsoleDatetimeSchema),
  warnings: v.optional(v.string()),
  errors: v.optional(v.string()),
  type: v.optional(
    v.picklist([
      "NOT_SITEMAP",
      "URL_LIST",
      "SITEMAP",
      "sitemap",
      "RSS_FEED",
      "ATOM_FEED",
      "PATTERN_SITEMAP",
      "OCEANFRONT",
    ]),
  ),
  contents: v.optional(v.array(sitemapContentSchema)),
})

export type SitemapEntry = v.InferOutput<typeof sitemapEntrySchema>
