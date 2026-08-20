import { describe, expect, it } from "bun:test"
import * as root from "@adaptive-ds/google-search-console-client"
import * as sourceRoot from "../src/index.js"
import * as searchAnalytics from "../src/searchAnalytics/index.js"
import * as searchAnalyticsSchemas from "../src/searchAnalytics/schemas/index.js"
import * as searchAnalyticsFlat from "../src/searchAnalyticsSchemas.js"
import * as sites from "../src/sites/index.js"
import * as sitesSchemas from "../src/sites/schemas/index.js"

type Assert<Condition extends true> = Condition
type IsEqual<Actual, Expected> =
  (<Value>() => Value extends Actual ? 1 : 2) extends <Value>() => Value extends Expected ? 1 : 2 ? true : false
type IsOptional<Type, Key extends keyof Type> = Record<never, never> extends Pick<Type, Key> ? true : false
type IsRequired<Type, Key extends keyof Type> = IsOptional<Type, Key> extends true ? false : true

type _siteEntrySchemaExportsAgree = Assert<
  IsEqual<sitesSchemas.SiteEntry, sites.SiteEntry> extends true
    ? IsEqual<sites.SiteEntry, sourceRoot.SiteEntry> extends true
      ? IsEqual<sourceRoot.SiteEntry, root.SiteEntry>
      : false
    : false
>
type _siteUrlIsRequired = Assert<IsRequired<root.SiteEntry, "siteUrl">>
type _permissionLevelIsRequired = Assert<IsRequired<root.SiteEntry, "permissionLevel">>

type _analyticsMetadataExportsAgree = Assert<
  IsEqual<searchAnalyticsSchemas.SearchAnalyticsMetadata, searchAnalytics.SearchAnalyticsMetadata> extends true
    ? IsEqual<searchAnalytics.SearchAnalyticsMetadata, sourceRoot.SearchAnalyticsMetadata> extends true
      ? IsEqual<sourceRoot.SearchAnalyticsMetadata, root.SearchAnalyticsMetadata>
      : false
    : false
>
type _metadataDateIsOptional = Assert<IsOptional<root.SearchAnalyticsMetadata, "firstIncompleteDate">>
type _metadataHourIsOptional = Assert<IsOptional<root.SearchAnalyticsMetadata, "firstIncompleteHour">>

type _analyticsRowMetricsAreRequired = Assert<
  IsRequired<root.SearchAnalyticsRow, "clicks"> extends true
    ? IsRequired<root.SearchAnalyticsRow, "impressions"> extends true
      ? IsRequired<root.SearchAnalyticsRow, "ctr"> extends true
        ? true
        : false
      : false
    : false
>
type _analyticsRowKeysAreOptional = Assert<IsOptional<root.SearchAnalyticsRow, "keys">>
type _analyticsRowPositionIsOptional = Assert<IsOptional<root.SearchAnalyticsRow, "position">>

type RequestDimension = NonNullable<root.SearchAnalyticsQueryRequest["dimensions"]>[number]
type _analyticsQueryRequestInputExportsAgree = Assert<
  IsEqual<
    searchAnalyticsSchemas.SearchAnalyticsQueryRequestInput,
    searchAnalyticsFlat.SearchAnalyticsQueryRequestInput
  > extends true
    ? IsEqual<
        searchAnalyticsFlat.SearchAnalyticsQueryRequestInput,
        searchAnalytics.SearchAnalyticsQueryRequestInput
      > extends true
      ? IsEqual<
          searchAnalytics.SearchAnalyticsQueryRequestInput,
          sourceRoot.SearchAnalyticsQueryRequestInput
        > extends true
        ? IsEqual<sourceRoot.SearchAnalyticsQueryRequestInput, root.SearchAnalyticsQueryRequestInput>
        : false
      : false
    : false
>
type _rowLimitIsOptionalNumber = Assert<IsEqual<root.SearchAnalyticsQueryRequest["rowLimit"], number | undefined>>
type _startRowIsOptionalNumber = Assert<IsEqual<root.SearchAnalyticsQueryRequest["startRow"], number | undefined>>
type _queryRequestOutputOmitsDeprecatedSearchType = Assert<
  "searchType" extends keyof sourceRoot.SearchAnalyticsQueryRequest ? false : true
>
type _queryRequestInputIncludesDeprecatedSearchType = Assert<
  "searchType" extends keyof root.SearchAnalyticsQueryRequestInput ? true : false
>
type _queryIsARequestDimension = Assert<"query" extends RequestDimension ? true : false>
type _unknownDimensionIsRejected = Assert<"unknown" extends RequestDimension ? false : true>
type _filterGroupFiltersAreOptional = Assert<IsOptional<root.SearchAnalyticsDimensionFilterGroup, "filters">>
type _filterGroupTypeIsOptional = Assert<IsOptional<root.SearchAnalyticsDimensionFilterGroup, "groupType">>
type _filterDimensionIsRequired = Assert<IsRequired<root.SearchAnalyticsDimensionFilter, "dimension">>
type _filterExpressionIsRequired = Assert<IsRequired<root.SearchAnalyticsDimensionFilter, "expression">>
type _filterOperatorIsOptional = Assert<IsOptional<root.SearchAnalyticsDimensionFilter, "operator">>

const siteEntry: root.SiteEntry = {
  siteUrl: "sc-domain:example.com",
  permissionLevel: "siteOwner",
}

const analyticsRow: root.SearchAnalyticsRow = {
  clicks: 12,
  impressions: 240,
  ctr: 0.05,
}

const analyticsMetadata: root.SearchAnalyticsMetadata = {
  firstIncompleteDate: "2026-08-14",
  firstIncompleteHour: "2026-08-14T12:00:00Z",
}

const analyticsFilterWithoutOperator: root.SearchAnalyticsDimensionFilter = {
  dimension: "query",
  expression: "shoes",
}

const analyticsFilterGroupWithoutGroupType: root.SearchAnalyticsDimensionFilterGroup = {
  filters: [analyticsFilterWithoutOperator],
}

const queryRequestWithoutOptionalRows: root.SearchAnalyticsQueryRequest = {
  siteUrl: "https://example.com/",
  startDate: "2026-08-01",
  endDate: "2026-08-15",
}

const queryRequestWithOptionalRows: root.SearchAnalyticsQueryRequest = {
  ...queryRequestWithoutOptionalRows,
  dimensions: ["query", "country"],
  rowLimit: 25000,
  startRow: 0,
}

const queryRequestWithDeprecatedSearchType: Parameters<typeof sourceRoot.searchAnalyticsQuery>[1] = {
  siteUrl: "https://example.com/",
  startDate: "2026-08-01",
  endDate: "2026-08-15",
  searchType: "web",
}
const queryRequestInput: root.SearchAnalyticsQueryRequestInput = {
  siteUrl: "https://example.com/",
  startDate: "2026-08-01",
  endDate: "2026-08-15",
  searchType: "web",
}

void siteEntry
void analyticsRow
void analyticsMetadata
void analyticsFilterGroupWithoutGroupType
void queryRequestWithOptionalRows
void queryRequestWithDeprecatedSearchType
void queryRequestInput

// @ts-expect-error SiteEntry requires siteUrl and permissionLevel.
const incompleteSiteEntry: root.SiteEntry = {}

// @ts-expect-error Search Analytics rows require clicks, impressions, and CTR.
const incompleteAnalyticsRow: root.SearchAnalyticsRow = { keys: ["shoes"] }

void queryRequestWithoutOptionalRows
void incompleteSiteEntry
void incompleteAnalyticsRow

describe("schema exports", () => {
  it("exports changed schemas from schema, bounded-context, and root barrels", () => {
    expect(sitesSchemas.siteEntrySchema).toBe(sites.siteEntrySchema)
    expect(sites.siteEntrySchema).toBe(sourceRoot.siteEntrySchema)
    expect(root.siteEntrySchema).toBeDefined()
    expect(sitesSchemas.sitesListResponseSchema).toBe(sites.sitesListResponseSchema)
    expect(sites.sitesListResponseSchema).toBe(sourceRoot.sitesListResponseSchema)
    expect(root.sitesListResponseSchema).toBeDefined()

    expect(searchAnalyticsSchemas.searchAnalyticsMetadataSchema).toBe(searchAnalytics.searchAnalyticsMetadataSchema)
    expect(searchAnalytics.searchAnalyticsMetadataSchema).toBe(sourceRoot.searchAnalyticsMetadataSchema)
    expect(root.searchAnalyticsMetadataSchema).toBeDefined()
    expect(searchAnalyticsSchemas.searchAnalyticsDimensionFilterSchema).toBe(
      searchAnalytics.searchAnalyticsDimensionFilterSchema,
    )
    expect(searchAnalytics.searchAnalyticsDimensionFilterSchema).toBe(sourceRoot.searchAnalyticsDimensionFilterSchema)
    expect(root.searchAnalyticsDimensionFilterSchema).toBeDefined()
    expect(searchAnalyticsSchemas.searchAnalyticsDimensionFilterGroupSchema).toBe(
      searchAnalytics.searchAnalyticsDimensionFilterGroupSchema,
    )
    expect(searchAnalytics.searchAnalyticsDimensionFilterGroupSchema).toBe(
      sourceRoot.searchAnalyticsDimensionFilterGroupSchema,
    )
    expect(root.searchAnalyticsDimensionFilterGroupSchema).toBeDefined()
    expect(searchAnalyticsSchemas.searchAnalyticsRowSchema).toBe(searchAnalytics.searchAnalyticsRowSchema)
    expect(searchAnalytics.searchAnalyticsRowSchema).toBe(sourceRoot.searchAnalyticsRowSchema)
    expect(root.searchAnalyticsRowSchema).toBeDefined()
    expect(searchAnalyticsSchemas.searchAnalyticsQueryRequestSchema).toBe(
      searchAnalytics.searchAnalyticsQueryRequestSchema,
    )
    expect(searchAnalytics.searchAnalyticsQueryRequestSchema).toBe(sourceRoot.searchAnalyticsQueryRequestSchema)
    expect(root.searchAnalyticsQueryRequestSchema).toBeDefined()
    expect(searchAnalyticsSchemas.searchAnalyticsQueryResponseSchema).toBe(
      searchAnalytics.searchAnalyticsQueryResponseSchema,
    )
    expect(searchAnalytics.searchAnalyticsQueryResponseSchema).toBe(sourceRoot.searchAnalyticsQueryResponseSchema)
    expect(root.searchAnalyticsQueryResponseSchema).toBeDefined()
  })
})
