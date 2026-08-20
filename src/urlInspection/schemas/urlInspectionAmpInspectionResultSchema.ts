import * as v from "valibot"
import { googleSearchConsoleDatetimeSchema } from "../../shared/googleSearchConsoleDatetimeSchema.js"
import { urlInspectionAmpIssueSchema } from "./urlInspectionAmpIssueSchema.js"

export const urlInspectionAmpInspectionResultSchema = v.object({
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
  robotsTxtState: v.optional(v.picklist(["ROBOTS_TXT_STATE_UNSPECIFIED", "ALLOWED", "DISALLOWED"])),
  indexingState: v.optional(
    v.picklist([
      "AMP_INDEXING_STATE_UNSPECIFIED",
      "AMP_INDEXING_ALLOWED",
      "BLOCKED_DUE_TO_NOINDEX",
      "BLOCKED_DUE_TO_EXPIRED_UNAVAILABLE_AFTER",
    ]),
  ),
  lastCrawlTime: v.optional(googleSearchConsoleDatetimeSchema),
  issues: v.optional(v.array(urlInspectionAmpIssueSchema)),
  verdict: v.optional(v.picklist(["VERDICT_UNSPECIFIED", "PASS", "PARTIAL", "FAIL", "NEUTRAL"])),
  ampIndexStatusVerdict: v.optional(v.picklist(["VERDICT_UNSPECIFIED", "PASS", "PARTIAL", "FAIL", "NEUTRAL"])),
  ampUrl: v.optional(v.string()),
})

export type UrlInspectionAmpInspectionResult = v.InferOutput<typeof urlInspectionAmpInspectionResultSchema>
