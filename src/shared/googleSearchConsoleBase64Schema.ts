import * as v from "valibot"

export const googleSearchConsoleBase64Schema = v.pipe(
  v.string(),
  v.regex(/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/, "must be valid base64"),
)
