import * as v from "valibot"
import { googleSearchConsoleDatetimeSchema } from "../../shared/googleSearchConsoleDatetimeSchema.js"

export const urlInspectionItemSchema = v.object({
  verdict: v.optional(v.picklist(["VERDICT_UNSPECIFIED", "PASS", "PARTIAL", "FAIL", "NEUTRAL"])),
  coverageState: v.optional(v.string()),
  robotsTxtState: v.optional(v.picklist(["ROBOTS_TXT_STATE_UNSPECIFIED", "ALLOWED", "DISALLOWED"])),
  indexingState: v.optional(
    v.picklist([
      "INDEXING_STATE_UNSPECIFIED",
      "INDEXING_ALLOWED",
      "BLOCKED_BY_META_TAG",
      "BLOCKED_BY_HTTP_HEADER",
      "BLOCKED_BY_ROBOTS_TXT",
    ]),
  ),
  lastCrawlTime: v.optional(googleSearchConsoleDatetimeSchema),
  pageFetchState: v.optional(
    v.picklist([
      "PAGE_FETCH_STATE_UNSPECIFIED",
      "SUCCESSFUL",
      "SOFT_404",
      "BLOCKED_ROBOTS_TXT",
      "NOT_FOUND",
      "ACCESS_DENIED",
      "SERVER_ERROR",
      "REDIRECT_ERROR",
      "ACCESS_FORBIDDEN",
      "BLOCKED_4XX",
      "INTERNAL_CRAWL_ERROR",
      "INVALID_URL",
    ]),
  ),
  googleCanonical: v.optional(v.string()),
  userCanonical: v.optional(v.string()),
  crawledAs: v.optional(v.picklist(["CRAWLING_USER_AGENT_UNSPECIFIED", "DESKTOP", "MOBILE"])),
  sitemap: v.optional(v.array(v.string())),
  referringUrls: v.optional(v.array(v.string())),
})

export type UrlInspectionItem = v.InferOutput<typeof urlInspectionItemSchema>
