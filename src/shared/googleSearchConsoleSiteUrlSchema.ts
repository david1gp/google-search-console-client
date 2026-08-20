import * as v from "valibot"
import { googleSearchConsoleUrlSchema } from "./googleSearchConsoleUrlSchema.js"

export const googleSearchConsoleSiteUrlSchema = v.union([
  googleSearchConsoleUrlSchema,
  v.pipe(v.string(), v.regex(/^sc-domain:.+$/, "must be a valid Search Console domain property")),
])
