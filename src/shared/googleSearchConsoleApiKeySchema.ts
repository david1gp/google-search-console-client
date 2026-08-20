import * as v from "valibot"

export const googleSearchConsoleApiKeySchema = v.pipe(v.string(), v.minLength(1))
