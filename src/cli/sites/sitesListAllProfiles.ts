import { createResult, createResultError, type Result } from "#result"
import { googleSearchConsoleClientCreate } from "../../shared/googleSearchConsoleClientCreate.js"
import { sitesList } from "../../sites/list/sitesList.js"
import type { SitesListResponse } from "../../sites/schemas/sitesListResponseSchema.js"
import type {
  GoogleSearchConsoleCliConfigCreateOptions,
  GoogleSearchConsoleCliEnvironment,
} from "../googleSearchConsoleCliConfigCreate.js"
import { googleSearchConsoleCliConfigCreate } from "../googleSearchConsoleCliConfigCreate.js"
import { googleSearchConsoleCliProfileNamesResolve } from "../googleSearchConsoleCliProfileNamesResolve.js"

type SitesListAllProfilesEntry = NonNullable<SitesListResponse["siteEntry"]>[number] & {
  readonly profile: string
}

type SitesListAllProfilesResponse = {
  readonly siteEntry: SitesListAllProfilesEntry[]
}

export async function sitesListAllProfiles(
  input: GoogleSearchConsoleCliConfigCreateOptions,
  environment?: GoogleSearchConsoleCliEnvironment,
): Promise<Result<SitesListAllProfilesResponse>> {
  const op = "sitesListAllProfiles"
  if (input.profile !== undefined) return createResultError(op, "--all-profiles cannot be combined with --profile")
  if (input.credentialsFile !== undefined)
    return createResultError(op, "--all-profiles cannot be combined with an explicit credentials file")

  const profilesResult = await googleSearchConsoleCliProfileNamesResolve(environment)
  if (!profilesResult.success) return { ...profilesResult, op }
  if (profilesResult.data.length === 0) return createResultError(op, "No configured credential profiles were found")

  const entries: SitesListAllProfilesEntry[] = []
  for (const profile of profilesResult.data) {
    const configResult = await googleSearchConsoleCliConfigCreate({
      ...input,
      env: environment,
      profile,
    })
    if (!configResult.success) return sitesListAllProfilesProfileError(profile, configResult)

    const clientResult = googleSearchConsoleClientCreate(configResult.data)
    if (!clientResult.success) return sitesListAllProfilesProfileError(profile, clientResult)

    const sitesResult = await sitesList(clientResult.data)
    if (!sitesResult.success) return sitesListAllProfilesProfileError(profile, sitesResult)
    for (const entry of sitesResult.data.siteEntry ?? []) entries.push({ ...entry, profile })
  }

  return createResult({ siteEntry: entries })
}

function sitesListAllProfilesProfileError(profile: string, result: Result<unknown>): Result<never> {
  if (result.success) return createResultError("sitesListAllProfiles", `Profile "${profile}" did not return an error`)
  return {
    ...result,
    op: "sitesListAllProfiles",
    errorMessage: `Profile "${profile}": ${result.errorMessage}`,
  }
}
