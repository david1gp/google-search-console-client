import * as v from "valibot"

export const googleSearchConsoleCliProfileNameSchema = v.pipe(
  v.string(),
  v.minLength(1, "profile name cannot be empty"),
  v.maxLength(64, "profile name cannot exceed 64 characters"),
  v.regex(/^[A-Za-z0-9][A-Za-z0-9._-]*$/, "profile name must be a simple name and cannot contain a path"),
)

export type GoogleSearchConsoleCliProfileName = v.InferOutput<typeof googleSearchConsoleCliProfileNameSchema>
