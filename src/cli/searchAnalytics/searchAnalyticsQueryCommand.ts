import { buildCommand, numberParser } from "@stricli/core"
import { searchAnalyticsQuery } from "../../searchAnalytics/query/searchAnalyticsQuery.js"
import type {
  SearchAnalyticsDimensionFilterGroup,
  SearchAnalyticsQueryRequest,
} from "../../searchAnalytics/schemas/index.js"
import { googleSearchConsoleCliCommandExecute } from "../googleSearchConsoleCliCommandExecute.js"
import type { GoogleSearchConsoleCliFlags } from "../googleSearchConsoleCliFlags.js"
import { googleSearchConsoleCliOptions } from "../googleSearchConsoleCliOptions.js"
import type { GoogleSearchConsoleCommandContext } from "../googleSearchConsoleCommandContext.js"

const searchAnalyticsDimensionValues = [
  "DATE",
  "QUERY",
  "PAGE",
  "COUNTRY",
  "DEVICE",
  "SEARCH_APPEARANCE",
  "HOUR",
] as const
const searchAnalyticsSearchTypeValues = ["WEB", "IMAGE", "VIDEO", "NEWS", "DISCOVER", "GOOGLE_NEWS"] as const
const searchAnalyticsAggregationTypeValues = ["AUTO", "BY_PROPERTY", "BY_PAGE", "BY_NEWS_SHOWCASE_PANEL"] as const
const searchAnalyticsDataStateValues = ["DATA_STATE_UNSPECIFIED", "FINAL", "ALL", "HOURLY_ALL"] as const

type SearchAnalyticsQueryCommandFlags = GoogleSearchConsoleCliFlags & {
  dimensions?: readonly (typeof searchAnalyticsDimensionValues)[number][]
  type?: SearchAnalyticsQueryRequest["type"]
  searchType?: SearchAnalyticsQueryRequest["searchType"]
  dimensionFilterGroups?: readonly SearchAnalyticsDimensionFilterGroup[]
  aggregationType?: SearchAnalyticsQueryRequest["aggregationType"]
  startRow?: number
  rowLimit?: number
  dataState?: SearchAnalyticsQueryRequest["dataState"]
}

export const searchAnalyticsQueryCommand = buildCommand<
  SearchAnalyticsQueryCommandFlags,
  [siteUrl: string, startDate: string, endDate: string],
  GoogleSearchConsoleCommandContext
>({
  func: async function (flags, siteUrl, startDate, endDate) {
    return googleSearchConsoleCliCommandExecute(this, {
      clientInput: flags,
      execute: (client) =>
        searchAnalyticsQuery(client, {
          siteUrl,
          startDate,
          endDate,
          dimensions: flags.dimensions === undefined ? undefined : [...flags.dimensions],
          type: flags.type,
          searchType: flags.searchType,
          dimensionFilterGroups:
            flags.dimensionFilterGroups === undefined ? undefined : [...flags.dimensionFilterGroups],
          aggregationType: flags.aggregationType,
          startRow: flags.startRow,
          rowLimit: flags.rowLimit,
          dataState: flags.dataState,
        }),
      op: "searchAnalyticsQuery",
    })
  },
  parameters: {
    flags: {
      ...googleSearchConsoleCliOptions,
      dimensions: {
        brief: "Dimensions to group by",
        kind: "enum",
        optional: true,
        values: searchAnalyticsDimensionValues,
        variadic: ",",
      },
      type: {
        brief: "Search Analytics report type",
        kind: "enum",
        optional: true,
        values: searchAnalyticsSearchTypeValues,
      },
      searchType: {
        brief: "Search type filter",
        kind: "enum",
        optional: true,
        values: searchAnalyticsSearchTypeValues,
      },
      dimensionFilterGroups: {
        brief: "Dimension filter groups as a JSON array",
        kind: "parsed",
        optional: true,
        parse: (input) => JSON.parse(input) as SearchAnalyticsDimensionFilterGroup[],
        placeholder: "json",
      },
      aggregationType: {
        brief: "Result aggregation type",
        kind: "enum",
        optional: true,
        values: searchAnalyticsAggregationTypeValues,
      },
      startRow: {
        brief: "Zero-based first row",
        kind: "parsed",
        optional: true,
        parse: numberParser,
        placeholder: "number",
      },
      rowLimit: {
        brief: "Maximum rows to return",
        kind: "parsed",
        optional: true,
        parse: numberParser,
        placeholder: "number",
      },
      dataState: {
        brief: "Data state",
        kind: "enum",
        optional: true,
        values: searchAnalyticsDataStateValues,
      },
    },
    positional: {
      kind: "tuple",
      parameters: [
        {
          brief: "Search Console site URL",
          placeholder: "site-url",
          parse: (input) => input,
        },
        {
          brief: "Inclusive start date (YYYY-MM-DD)",
          placeholder: "start-date",
          parse: (input) => input,
        },
        {
          brief: "Inclusive end date (YYYY-MM-DD)",
          placeholder: "end-date",
          parse: (input) => input,
        },
      ],
    },
  },
  docs: {
    brief: "Query Search Console Search Analytics data",
  },
})
