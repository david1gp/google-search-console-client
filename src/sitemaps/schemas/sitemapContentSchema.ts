import * as v from "valibot"

export const sitemapContentSchema = v.object({
  type: v.optional(
    v.picklist([
      "WEB",
      "web",
      "IMAGE",
      "image",
      "VIDEO",
      "video",
      "NEWS",
      "news",
      "MOBILE",
      "mobile",
      "ANDROID_APP",
      "androidApp",
      "PATTERN",
      "pattern",
      "IOS_APP",
      "iosApp",
      "DATA_FEED_ELEMENT",
    ]),
  ),
  submitted: v.optional(v.string()),
  indexed: v.optional(v.string()),
})

export type SitemapContent = v.InferOutput<typeof sitemapContentSchema>
