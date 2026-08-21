# Default credentials file

## Goal

Load Google Search Console credentials from `~/.config/google-search-console/credentials.json` without explicit configuration, with a global environment variable for overriding the file location.

## Decisions

- Use `GOOGLE_SEARCH_CONSOLE_CREDENTIALS_FILE` as the path override.
- Keep CLI flags and direct credential environment variables higher precedence than JSON file values.
- A missing default file is non-fatal; an explicitly selected unreadable or invalid file returns a clear configuration error.
- Preserve `--env-file` as the existing dotenv mechanism.

## OAuth credential shapes and secret handling

The default file is `~/.config/google-search-console/credentials.json`. Set `GOOGLE_SEARCH_CONSOLE_CREDENTIALS_FILE` as a direct environment variable to override it; a dotenv file does not select the credentials-file path. A missing default file is allowed, but an explicitly selected file must be readable, valid JSON, and contain a supported credential.

In addition to static credentials, the file accepts refresh-token OAuth in either of these forms:

```json
{
  "oauth": {
    "clientId": "<client-id>",
    "clientSecret": "<client-secret>",
    "refreshToken": "<refresh-token>",
    "tokenUrl": "https://oauth2.googleapis.com/token"
  }
}
```

```json
{
  "client_id": "<client-id>",
  "client_secret": "<client-secret>",
  "refresh_token": "<refresh-token>",
  "token_uri": "https://oauth2.googleapis.com/token"
}
```

The flat form is the Google authorized-user format. `tokenUrl`/`token_uri` is optional and defaults to `https://oauth2.googleapis.com/token`; the client ID and refresh token are required, while the client secret is optional for public desktop clients. For each OAuth field, direct environment values take precedence over dotenv values, which take precedence over nested JSON, which takes precedence over flat JSON. The supported OAuth environment variables are `GOOGLE_SEARCH_CONSOLE_OAUTH_CLIENT_ID`, optional `GOOGLE_SEARCH_CONSOLE_OAUTH_CLIENT_SECRET`, `GOOGLE_SEARCH_CONSOLE_OAUTH_REFRESH_TOKEN`, and optional `GOOGLE_SEARCH_CONSOLE_OAUTH_TOKEN_URL`.

### Combining an installed-app file with an existing refresh token

Google's installed-app client-secrets download normally wraps its values in `installed`. It is not the credentials-file shape consumed directly by this CLI. Extract `installed.client_id`, `installed.client_secret`, and optional `installed.token_uri`, then combine them with the existing refresh token as the flat authorized-user JSON above. Keep all input and output files private:

- Use `umask 077` and a configuration directory with mode `700`.
- Use mode `600` for the client-secrets file, refresh-token source, dotenv file, and generated `credentials.json`.
- Do not pass secrets as command-line arguments, print them, commit them, or include them in logs. Replace path placeholders only; never put real secret values in documentation or scripts.

For example, this local Python script reads a protected client-secrets file and a one-line refresh-token file and writes the default credentials file without printing secret values:

```bash
umask 077
python3 - <<'PY'
import json
import os
from pathlib import Path

client_secrets_path = Path("/secure/path/client-secret.json")
refresh_token_path = Path("/secure/path/refresh-token.txt")
output_path = Path.home() / ".config/google-search-console/credentials.json"

installed = json.loads(client_secrets_path.read_text())["installed"]
credentials = {
    "client_id": installed["client_id"],
    "client_secret": installed["client_secret"],
    "refresh_token": refresh_token_path.read_text().strip(),
}
if installed.get("token_uri") is not None:
    credentials["token_uri"] = installed["token_uri"]

output_path.parent.mkdir(mode=0o700, parents=True, exist_ok=True)
os.chmod(output_path.parent, 0o700)
file_descriptor = os.open(output_path, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
with os.fdopen(file_descriptor, "w") as output_file:
    json.dump(credentials, output_file, indent=2)
    output_file.write("\n")
os.chmod(output_path, 0o600)
PY
```

Remove temporary copies after checking the generated file's mode. The library itself does not read this file; library callers pass the equivalent nested `oauth` object to `googleSearchConsoleClientCreate`.

## Runtime behavior

For existing refresh-token credentials, the CLI and library use the refresh token non-interactively and do not launch a browser, obtain consent, or persist returned access tokens. The CLI's separate `auth login` command can obtain consent and save refresh credentials; it uses the default file unless `--credentials-file` or `GOOGLE_SEARCH_CONSOLE_CREDENTIALS_FILE` selects another path. During requests, OAuth access tokens are cached only in memory per client, refreshed 60 seconds before expiry, and shared across concurrent refreshes. A refresh-backed request receiving `401` invalidates the cached token, refreshes, and retries once. A static `accessToken` has precedence and does not use automatic refresh or retry; Mobile-Friendly API-key authentication remains separate.

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
