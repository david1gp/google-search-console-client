import * as v from "valibot"
import { createResultError, type Result } from "#result"
import type { GoogleSearchConsoleClient } from "../shared/GoogleSearchConsoleClient.js"
import { googleSearchConsoleRequest } from "../shared/googleSearchConsoleRequest.js"
import { domainNameSchema } from "./domainNameSchema.js"

const googleSiteVerificationTokenSchema = v.object({
  method: v.string(),
  token: v.pipe(v.string(), v.minLength(1)),
})

export async function googleSiteVerificationTokenGet(
  client: GoogleSearchConsoleClient,
  domain: string,
  options?: { baseUrl?: string },
): Promise<Result<v.InferOutput<typeof googleSiteVerificationTokenSchema>>> {
  const op = "googleSiteVerificationTokenGet"
  const parsedDomain = v.safeParse(domainNameSchema, domain)
  if (!parsedDomain.success) return createResultError(op, v.summarize(parsedDomain.issues), domain)

  const result = await googleSearchConsoleRequest(client, {
    op,
    baseUrl: options?.baseUrl ?? "https://www.googleapis.com/siteVerification/v1",
    path: "/token",
    method: "POST",
    body: {
      site: { identifier: parsedDomain.output, type: "INET_DOMAIN" },
      verificationMethod: "DNS_TXT",
    },
    schema: googleSiteVerificationTokenSchema,
  })
  if (!result.success) return result
  if (result.data.method !== "DNS_TXT") return createResultError(op, "Google returned a non-DNS_TXT verification token")
  return result
}
