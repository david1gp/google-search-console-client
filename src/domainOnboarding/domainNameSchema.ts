import * as v from "valibot"

export const domainNameSchema = v.pipe(
  v.string(),
  v.transform((value) => value.trim().toLowerCase()),
  v.regex(
    /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/,
    "must be a valid domain name",
  ),
)

export type DomainName = v.InferOutput<typeof domainNameSchema>
