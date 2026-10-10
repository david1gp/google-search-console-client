#!/usr/bin/env bash
set -euo pipefail

echo "Running the local @adaptive-ds/google-search-console-client deployment preflight."
bun run format
bun check
bun run test
bun run build
