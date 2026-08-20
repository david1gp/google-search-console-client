import type { GoogleSearchConsoleCliFlags } from "./googleSearchConsoleCliFlags.js"

const googleSearchConsoleCliStringOption = (brief: string, placeholder: string) => ({
  brief,
  kind: "parsed" as const,
  optional: true as const,
  parse: (input: string) => input,
  placeholder,
})

export const googleSearchConsoleCliOptions: {
  readonly [K in keyof GoogleSearchConsoleCliFlags]-?: ReturnType<typeof googleSearchConsoleCliStringOption>
} = {
  accessToken: googleSearchConsoleCliStringOption("OAuth bearer access token", "token"),
  apiKey: googleSearchConsoleCliStringOption("Mobile-Friendly Testing API key (alias)", "api-key"),
  mobileFriendlyApiKey: googleSearchConsoleCliStringOption("Mobile-Friendly Testing API key", "api-key"),
  baseUrl: googleSearchConsoleCliStringOption("Search Console Webmasters API base URL", "url"),
  urlInspectionBaseUrl: googleSearchConsoleCliStringOption("URL Inspection API base URL", "url"),
  envFile: googleSearchConsoleCliStringOption("Load credentials and URLs from a dotenv file", "path"),
}
