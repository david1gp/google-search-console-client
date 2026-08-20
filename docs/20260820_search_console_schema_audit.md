# Search Console schema audit

## Goal

Audit the client against official Google Search Console REST contracts and real-world ecosystem reports, tighten response schemas and inferred types where supported, and add consumer-friendly schema documentation and examples.

## Decisions

- Treat official REST endpoint documentation and observed JSON wire values as authoritative over discovery enum identifiers when they conflict.
- Keep top-level response members optional where Google legitimately omits them, including empty Search Analytics `rows`.
- Require `siteUrl` and `permissionLevel` inside returned site entries.
- Require clicks, impressions, and CTR in each Analytics row; keep `keys` optional for dimensionless queries and `position` optional because Discover and Google News omit it.
- Preserve forward compatibility for unknown response members and open-ended row-key values.
- Keep request, filter, and filter-group objects strict so typos fail before an API call.
- Add documented request bounds (`rowLimit`, `startRow`, dates, unique dimensions, filter-expression length) and the documented CTR range without encoding undocumented API business rules.
- Match filter defaults: filter groups and filters are optional collections, `groupType` is optional with effective `and` semantics, and filter `operator` is optional with `equals` as the API default.
- Normalize deprecated `searchType` to `type`; reject conflicting simultaneous values rather than relying on undocumented precedence.
- Support optional response metadata using its observed/discovery camelCase JSON field names while documenting the human-doc snake_case discrepancy.
- Keep positional `keys` as strings and document their relationship to requested dimensions rather than introducing a new generic API.
- Export distinct request input and canonical output types so deprecated compatibility input remains typeable.
- Treat the response tightening as a breaking type change for a future `0.3.0` release rather than another patch.
- Keep changes limited to Sites and Search Analytics unless the audit finds a concrete contract defect elsewhere.

## Approach

- Compare source schemas with official REST documentation, discovery metadata, representative open-source clients, and public issue reports.
- Record concrete mismatches and type-safety opportunities before changing code.
- Tighten schemas, add TSDoc/JSDoc examples, and add contract-focused tests.
- Verify locally and against authenticated live read-only commands on `leo@leo-server`.

## Tasks

- [complete] 1. Audit official Google contracts and known ecosystem issues.
- [complete] 2. Audit local schemas, inferred public types, and current tests.
- [complete] 3. Probe representative live response shapes.
- [complete] 4. Implement confirmed schema and documentation improvements.
- [complete] 5. Review, test, build, and run live remote verification.

## Paths

- `src/sites/`
- `src/searchAnalytics/`
- `src/cli/`
- `test/sites/`
- `test/searchAnalytics/`
- `test/cli/`
- `README.md`
