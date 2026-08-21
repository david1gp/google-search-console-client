# Credential profiles

## Goal

Support multiple Google Search Console credential profiles while keeping the single-account experience flag-free, then commit and release the feature through the existing OIDC workflow.

## Decisions

- The implicit profile is named `default`.
- `auth login` without `--profile` and regular commands without `--profile` use `default`.
- Named profiles are selected with `--profile <name>`.
- Keep the existing `credentials.json` behavior compatible; profile storage must not break current users or explicit `--credentials-file` usage.
- Only `sites list` supports `--all-profiles`; aggregated entries identify the configured profile and retain each API response's `permissionLevel`.
- A normal command always uses one profile, avoiding silent account mixing.
- Profile names are validated and cannot contain paths.

## Approach

- Centralize validated profile-to-credentials resolution and profile discovery in the CLI credential layer.
- Extend shared CLI options so profile selection reaches configuration creation and OAuth login/pending completion.
- Reuse the existing per-profile client and Sites API behavior; aggregate explicitly only for `sites list --all-profiles`.
- Preserve output compatibility for commands without `--all-profiles` and preserve existing credential/environment precedence.
- Cover default, named, legacy, OAuth, aggregation, security, and error behavior with focused tests and user documentation.

## Tasks

- [x] 1. Implement profile storage, validation, selection, and common CLI options with legacy compatibility.
- [x] 2. Make OAuth login and pending completion persist the default or selected named profile safely.
- [x] 3. Implement profile-attributed `sites list --all-profiles` aggregation.
- [x] 4. Add/update tests and documentation, then run formatting, checks, and the full test suite.
- [x] 5. Create conventional feature commit(s) and push them.
- [ ] 6. Create the next minor release, verify the GitHub Actions OIDC publish and npm result, and fix/re-release if needed.

## Paths

- `src/cli/`
- `src/cli/auth/`
- `src/cli/sites/`
- `test/cli/`
- `README.md`
- `package.json`
- `ops/release.sh`
- `.github/workflows/publish.yml`
