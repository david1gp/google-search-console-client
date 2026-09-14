import * as v from "valibot"
import { createResult, createResultError, type Result } from "#result"
import type { GoogleSearchConsoleFetch } from "../shared/googleSearchConsoleFetch.js"
import { cloudflareRequest } from "./cloudflareRequest.js"

const cloudflareDnsRecordSchema = v.object({
  id: v.string(),
  type: v.string(),
  name: v.string(),
  content: v.string(),
  ttl: v.optional(v.number()),
  proxied: v.optional(v.boolean()),
})

export async function cloudflareDnsTxtEnsure(
  zoneId: string,
  options: {
    apiToken: string
    name: string
    content: string
    ttl?: number
    fetch?: GoogleSearchConsoleFetch
    baseUrl?: string
  },
): Promise<Result<{ created: boolean; record: v.InferOutput<typeof cloudflareDnsRecordSchema> }>> {
  const op = "cloudflareDnsTxtEnsure"
  if (zoneId.length === 0) return createResultError(op, "Cloudflare zone ID is required")
  if (options.name.length === 0) return createResultError(op, "DNS record name is required")
  if (options.content.length === 0) return createResultError(op, "DNS record content is required")
  if (options.ttl !== undefined && (!Number.isInteger(options.ttl) || options.ttl < 1)) {
    return createResultError(op, "DNS record TTL must be a positive integer")
  }

  const requestOptions = {
    apiToken: options.apiToken,
    fetch: options.fetch,
    baseUrl: options.baseUrl ?? "https://api.cloudflare.com/client/v4",
    op,
  }
  const recordsResult = await cloudflareRequest({
    ...requestOptions,
    path: `/zones/${encodeURIComponent(zoneId)}/dns_records`,
    query: { type: "TXT", name: options.name },
    schema: v.array(cloudflareDnsRecordSchema),
  })
  if (!recordsResult.success) return recordsResult
  const existingRecord = recordsResult.data.result?.find(
    (record) => record.type === "TXT" && record.name === options.name && record.content === options.content,
  )
  if (existingRecord !== undefined) return createResult({ created: false, record: existingRecord })

  const createResultValue = await cloudflareRequest({
    ...requestOptions,
    path: `/zones/${encodeURIComponent(zoneId)}/dns_records`,
    method: "POST",
    body: {
      type: "TXT",
      name: options.name,
      content: options.content,
      ttl: options.ttl ?? 1,
    },
    schema: cloudflareDnsRecordSchema,
  })
  if (!createResultValue.success) return createResultValue
  if (createResultValue.data.result === undefined)
    return createResultError(op, "Cloudflare did not return the created DNS record")
  return createResult({ created: true, record: createResultValue.data.result })
}
