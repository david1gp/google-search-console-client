import * as v from "valibot"

export const urlInspectionItemSchema = v.object({
  verdict: v.optional(v.string()),
  coverageState: v.optional(v.string()),
  robotsTxtState: v.optional(v.string()),
  indexingState: v.optional(v.string()),
  lastCrawlTime: v.optional(v.string()),
  pageFetchState: v.optional(v.string()),
  googleCanonical: v.optional(v.string()),
  userCanonical: v.optional(v.string()),
  crawledAs: v.optional(v.string()),
})

export const urlInspectionIndexInspectResponseSchema = v.object({
  inspectionResult: v.optional(
    v.object({
      inspectionUrl: v.optional(v.string()),
      indexStatusResult: v.optional(urlInspectionItemSchema),
    }),
  ),
})

export const urlInspectionIndexInspectRequestSchema = v.object({
  inspectionUrl: v.string(),
  siteUrl: v.string(),
  languageCode: v.optional(v.string()),
})

export type UrlInspectionItem = v.InferOutput<typeof urlInspectionItemSchema>
export type UrlInspectionIndexInspectResponse = v.InferOutput<typeof urlInspectionIndexInspectResponseSchema>
export type UrlInspectionIndexInspectRequest = v.InferOutput<typeof urlInspectionIndexInspectRequestSchema>
