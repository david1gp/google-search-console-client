import * as v from "valibot"

export const sitemapContentSchema = v.object({
  type: v.optional(
    v.picklist(["WEB", "IMAGE", "VIDEO", "NEWS", "MOBILE", "ANDROID_APP", "PATTERN", "IOS_APP", "DATA_FEED_ELEMENT"]),
  ),
  submitted: v.optional(v.string()),
  indexed: v.optional(v.string()),
})

export type SitemapContent = v.InferOutput<typeof sitemapContentSchema>
