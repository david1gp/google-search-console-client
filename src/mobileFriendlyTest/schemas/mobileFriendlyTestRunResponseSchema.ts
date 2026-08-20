import * as v from "valibot"
import { mobileFriendlyTestImageSchema } from "./mobileFriendlyTestImageSchema.js"
import { mobileFriendlyTestIssueSchema } from "./mobileFriendlyTestIssueSchema.js"
import { mobileFriendlyTestResourceIssueSchema } from "./mobileFriendlyTestResourceIssueSchema.js"
import { mobileFriendlyTestStatusSchema } from "./mobileFriendlyTestStatusSchema.js"

export const mobileFriendlyTestRunResponseSchema = v.object({
  screenshot: v.optional(mobileFriendlyTestImageSchema),
  mobileFriendliness: v.optional(
    v.picklist(["MOBILE_FRIENDLY_TEST_RESULT_UNSPECIFIED", "MOBILE_FRIENDLY", "NOT_MOBILE_FRIENDLY"]),
  ),
  resourceIssues: v.optional(v.array(mobileFriendlyTestResourceIssueSchema)),
  testStatus: v.optional(mobileFriendlyTestStatusSchema),
  mobileFriendlyIssues: v.optional(v.array(mobileFriendlyTestIssueSchema)),
})

export type MobileFriendlyTestRunResponse = v.InferOutput<typeof mobileFriendlyTestRunResponseSchema>
