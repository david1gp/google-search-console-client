import * as v from "valibot"
import { googleSearchConsoleBase64Schema } from "../../shared/googleSearchConsoleBase64Schema.js"

export const mobileFriendlyTestImageSchema = v.object({
  mimeType: v.optional(v.string()),
  data: v.optional(googleSearchConsoleBase64Schema),
})

export type MobileFriendlyTestImage = v.InferOutput<typeof mobileFriendlyTestImageSchema>
