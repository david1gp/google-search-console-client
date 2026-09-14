import * as v from "valibot"
import { createResult, createResultError, type Result } from "#result"
import type { GoogleSearchConsoleClient } from "../shared/GoogleSearchConsoleClient.js"
import type { GoogleSearchConsoleFetch } from "../shared/googleSearchConsoleFetch.js"
import { siteAdd } from "../sites/add/siteAdd.js"
import { cloudflareDnsTxtEnsure } from "./cloudflareDnsTxtEnsure.js"
import { cloudflareZoneFindByDomain } from "./cloudflareZoneFindByDomain.js"
import { domainNameSchema } from "./domainNameSchema.js"
import { googleSiteVerificationInsert } from "./googleSiteVerificationInsert.js"
import { googleSiteVerificationTokenGet } from "./googleSiteVerificationTokenGet.js"

const defaultVerificationAttempts = 5
const defaultVerificationRetryDelayMs = 1_000

export async function googleSearchConsoleDomainOnboard(
  client: GoogleSearchConsoleClient,
  domain: string,
  options: {
    cloudflareApiToken: string
    cloudflareFetch?: GoogleSearchConsoleFetch
    cloudflareBaseUrl?: string
    googleSiteVerificationBaseUrl?: string
    maxVerificationAttempts?: number
    verificationRetryDelayMs?: number
    sleep?: (milliseconds: number) => Promise<void>
    ttl?: number
  },
): Promise<Result<{ domain: string; siteUrl: string; txtRecordCreated: boolean; verificationAttempts: number }>> {
  const op = "googleSearchConsoleDomainOnboard"
  const parsedDomain = v.safeParse(domainNameSchema, domain)
  if (!parsedDomain.success) return createResultError(op, v.summarize(parsedDomain.issues), domain)
  const maxAttempts = options.maxVerificationAttempts ?? defaultVerificationAttempts
  const retryDelayMs = options.verificationRetryDelayMs ?? defaultVerificationRetryDelayMs
  if (!Number.isInteger(maxAttempts) || maxAttempts < 1 || maxAttempts > 10) {
    return createResultError(op, "maxVerificationAttempts must be an integer from 1 through 10")
  }
  if (!Number.isInteger(retryDelayMs) || retryDelayMs < 0) {
    return createResultError(op, "verificationRetryDelayMs must be a non-negative integer")
  }

  const tokenResult = await googleSiteVerificationTokenGet(client, parsedDomain.output, {
    baseUrl: options.googleSiteVerificationBaseUrl,
  })
  if (!tokenResult.success) return { ...tokenResult, op }

  const zoneResult = await cloudflareZoneFindByDomain(parsedDomain.output, {
    apiToken: options.cloudflareApiToken,
    fetch: options.cloudflareFetch,
    baseUrl: options.cloudflareBaseUrl,
  })
  if (!zoneResult.success) return { ...zoneResult, op }

  const dnsResult = await cloudflareDnsTxtEnsure(zoneResult.data.id, {
    apiToken: options.cloudflareApiToken,
    name: parsedDomain.output,
    content: tokenResult.data.token,
    ttl: options.ttl,
    fetch: options.cloudflareFetch,
    baseUrl: options.cloudflareBaseUrl,
  })
  if (!dnsResult.success) return { ...dnsResult, op }

  const sleep =
    options.sleep ?? ((milliseconds: number) => new Promise<void>((resolve) => setTimeout(resolve, milliseconds)))
  let verificationAttempts = 0
  let lastVerificationResult: Result<unknown> | undefined
  while (verificationAttempts < maxAttempts) {
    verificationAttempts += 1
    const verificationResult = await googleSiteVerificationInsert(client, parsedDomain.output, {
      baseUrl: options.googleSiteVerificationBaseUrl,
    })
    if (verificationResult.success) {
      const siteResult = await siteAdd(client, `sc-domain:${parsedDomain.output}`)
      if (!siteResult.success) return { ...siteResult, op }
      return createResult({
        domain: parsedDomain.output,
        siteUrl: `sc-domain:${parsedDomain.output}`,
        txtRecordCreated: dnsResult.data.created,
        verificationAttempts,
      })
    }
    lastVerificationResult = verificationResult
    if (verificationAttempts < maxAttempts) {
      try {
        await sleep(retryDelayMs)
      } catch (error) {
        return createResultError(
          op,
          "Verification retry delay failed",
          error instanceof Error ? error.message : String(error),
        )
      }
    }
  }

  if (lastVerificationResult !== undefined && !lastVerificationResult.success) return { ...lastVerificationResult, op }
  return createResultError(op, "Google domain verification failed")
}
