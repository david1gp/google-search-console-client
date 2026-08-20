# Default credentials file

## Goal

Load Google Search Console credentials from `~/.config/google-search-console/credentials.json` without explicit configuration, with a global environment variable for overriding the file location.

## Decisions

- Use `GOOGLE_SEARCH_CONSOLE_CREDENTIALS_FILE` as the path override.
- Keep CLI flags and direct credential environment variables higher precedence than JSON file values.
- A missing default file is non-fatal; an explicitly selected unreadable or invalid file returns a clear configuration error.
- Preserve `--env-file` as the existing dotenv mechanism.

## Approach

- Add JSON credential-file path resolution and loading to CLI configuration creation.
- Expand the home-directory default without accessing a real user home in tests.
- Cover defaults, override, precedence, missing files, and invalid files.
- Document the file shape, path override, and precedence.

## Tasks

- [x] 1. Implement credential JSON path resolution and loading.
- [x] 2. Add focused automated tests.
- [x] 3. Update user documentation.
- [x] 4. Run the relevant verification suite.

## Paths

- `src/cli/googleSearchConsoleCliConfigCreate.ts`
- `test/cli/googleSearchConsoleCli.test.ts`
- `README.md`

## Current context

- Credential JSON loading is implemented in `src/cli/googleSearchConsoleCliConfigCreate.ts` with the planned precedence and missing-default behavior.
- Focused CLI coverage now exercises default and overridden paths, precedence, missing defaults, and invalid files.
- `README.md` documents the JSON keys, default and override paths, precedence, missing-file behavior, and the separate dotenv option.
- Full tests, checks, Biome validation, and diff hygiene pass; the complete diff matches the plan.
