import * as v from "valibot"

export const googleSearchConsoleUrlSchema = v.pipe(
  v.string(),
  v.url(),
  v.check((value) => value.startsWith("http://") || value.startsWith("https://"), "must use http or https"),
)
