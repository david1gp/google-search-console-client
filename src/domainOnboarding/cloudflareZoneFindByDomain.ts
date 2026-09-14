import * as v from "valibot"
import { createResult, createResultError, type Result } from "#result"
import type { GoogleSearchConsoleFetch } from "../shared/googleSearchConsoleFetch.js"
import { cloudflareRequest } from "./cloudflareRequest.js"
import { domainNameSchema } from "./domainNameSchema.js"

const cloudflareZoneSchema = v.object({
  id: v.string(),
  name: v.string(),
  status: v.optional(v.string()),
})

export async function cloudflareZoneFindByDomain(
  domain: string,
  options: {
    apiToken: string
    fetch?: GoogleSearchConsoleFetch
    baseUrl?: string
  },
): Promise<Result<v.InferOutput<typeof cloudflareZoneSchema>>> {
  const op = "cloudflareZoneFindByDomain"
  const parsedDomain = v.safeParse(domainNameSchema, domain)
  if (!parsedDomain.success) return createResultError(op, v.summarize(parsedDomain.issues), domain)

  const result = await cloudflareRequest({
    apiToken: options.apiToken,
    fetch: options.fetch,
    baseUrl: options.baseUrl ?? "https://api.cloudflare.com/client/v4",
    op,
    path: "/zones",
    query: { name: parsedDomain.output, status: "active" },
    schema: v.array(cloudflareZoneSchema),
  })
  if (!result.success) return result
  const zone = result.data.result?.find((entry) => entry.name.toLowerCase() === parsedDomain.output)
  if (zone === undefined) return createResultError(op, `Active Cloudflare zone not found for ${parsedDomain.output}`)
  return createResult(zone)
}
