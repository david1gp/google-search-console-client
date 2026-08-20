import * as v from "valibot"

export const googleSearchConsoleAccessTokenSchema = v.pipe(v.string(), v.minLength(1))
