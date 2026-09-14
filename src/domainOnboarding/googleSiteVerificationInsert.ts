import * as v from "valibot"
import { createResultError, type Result } from "#result"
import type { GoogleSearchConsoleClient } from "../shared/GoogleSearchConsoleClient.js"
import { googleSearchConsoleRequest } from "../shared/googleSearchConsoleRequest.js"
import { domainNameSchema } from "./domainNameSchema.js"

const googleSiteVerificationResourceSchema = v.object({
  id: v.optional(v.string()),
  site: v.optional(v.object({ identifier: v.string(), type: v.string() })),
  verificationMethod: v.optional(v.string()),
})

export async function googleSiteVerificationInsert(
  client: GoogleSearchConsoleClient,
  domain: string,
  options?: { baseUrl?: string },
): Promise<Result<v.InferOutput<typeof googleSiteVerificationResourceSchema>>> {
  const op = "googleSiteVerificationInsert"
  const parsedDomain = v.safeParse(domainNameSchema, domain)
  if (!parsedDomain.success) return createResultError(op, v.summarize(parsedDomain.issues), domain)

  return googleSearchConsoleRequest(client, {
    op,
    baseUrl: options?.baseUrl ?? "https://www.googleapis.com/siteVerification/v1",
    path: "/webResource",
    method: "POST",
    query: { verificationMethod: "DNS_TXT" },
    body: {
      site: { identifier: parsedDomain.output, type: "INET_DOMAIN" },
    },
    schema: googleSiteVerificationResourceSchema,
  })
}
