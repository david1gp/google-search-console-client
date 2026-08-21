export type GoogleSearchConsoleCliFlags = {
  readonly accessToken?: string
  readonly apiKey?: string
  readonly mobileFriendlyApiKey?: string
  readonly baseUrl?: string
  readonly urlInspectionBaseUrl?: string
  readonly envFile?: string
}

export type GoogleSearchConsoleOAuthLoginFlags = Pick<GoogleSearchConsoleCliFlags, "envFile"> & {
  readonly agent?: boolean
  readonly callbackUrl?: string
  readonly clientId?: string
  readonly clientSecret?: string
  readonly credentialsFile?: string
}
