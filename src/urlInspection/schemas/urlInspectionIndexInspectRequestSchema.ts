import * as v from "valibot"
import { googleSearchConsoleSiteUrlSchema } from "../../shared/googleSearchConsoleSiteUrlSchema.js"
import { googleSearchConsoleUrlSchema } from "../../shared/googleSearchConsoleUrlSchema.js"

export const urlInspectionIndexInspectRequestSchema = v.object({
  inspectionUrl: googleSearchConsoleUrlSchema,
  siteUrl: googleSearchConsoleSiteUrlSchema,
  languageCode: v.optional(v.string()),
})

export type UrlInspectionIndexInspectRequest = v.InferOutput<typeof urlInspectionIndexInspectRequestSchema>
