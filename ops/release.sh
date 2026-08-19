#!/bin/bash
set -x # Print all executed commands to the terminal
set -e # Exit immediately if a command exits with a non-zero status

# --- Configuration ---
CHANGELOGS_DIR="changelogs"
REPO_URL=$(git remote get-url origin | sed 's/\.git$//')
REPO_NAME=$(echo "$REPO_URL" | sed 's/.*://')
PACKAGE_JSON="package.json"

# --- Preflight checks ---
if ! command -v gh >/dev/null 2>&1; then
  echo "Error: GitHub CLI is not installed or not available in PATH."
  exit 1
fi

if ! gh auth status --hostname github.com >/dev/null 2>&1; then
  echo "Error: GitHub CLI is not authenticated for github.com."
  echo "Run: gh auth login"
  exit 1
fi

# --- Validate arguments ---
if [ $# -gt 1 ]; then
  echo "Error: Too many arguments. Provide 0 or 1 argument (the next version)."
  exit 1
fi

# --- Helper: get current version from package.json ---
CURRENT_VERSION=$(jq -r '.version' "$PACKAGE_JSON")

# --- Step 1: Generate changelog draft using git-cliff ---
echo "📝 Generating changelog since last release..."
CHANGELOG_BODY=$(git cliff --unreleased --strip all | sed '1{/^## \[unreleased\]$/d};2{/^$/d}')

if [[ -z "$CHANGELOG_BODY" || "$CHANGELOG_BODY" == *"No commits found"* ]]; then
  echo "⚠️ No new commits since last release. Exiting."
  exit 1
fi

echo "📄 Preview of release notes:"
echo "----------------------------------------"
echo "$CHANGELOG_BODY"
echo "----------------------------------------"

# --- Step 2: Generate new version ---
if [ $# -eq 1 ]; then
  NEW_VERSION=$1
  echo "🔖 Using provided version: $NEW_VERSION (previous: $CURRENT_VERSION)"
else
  if echo "$CHANGELOG_BODY" | grep -q "### 🚀 Features"; then
    echo "🚀 Features detected: bumping minor version"
    # Bump minor version
    IFS='.' read -r MAJOR MINOR PATCH <<< "$CURRENT_VERSION"
    NEW_VERSION="$MAJOR.$((MINOR + 1)).0"
  else
    echo "🐛 Patch changes: bumping patch version"
    # Bump patch version
    IFS='.' read -r MAJOR MINOR PATCH <<< "$CURRENT_VERSION"
    NEW_VERSION="$MAJOR.$MINOR.$((PATCH + 1))"
  fi
  echo "🔖 New version: $NEW_VERSION (previous: $CURRENT_VERSION)"
fi

# --- Step 3: Generate changelog file ---
DATE=$(date +%Y-%m-%d)
CHANGELOG_FILE="$CHANGELOGS_DIR/${DATE}_v${NEW_VERSION}.md"
mkdir -p "$CHANGELOGS_DIR"
FULL_CHANGELOG="## [${NEW_VERSION}] - ${DATE}

${CHANGELOG_BODY}"
echo "$FULL_CHANGELOG" >"$CHANGELOG_FILE"
echo "📄 Changelog saved to: $CHANGELOG_FILE"

# --- Step 4: Changelog ---
echo "📄 Generated changelog:"
cat "$CHANGELOG_FILE"

# --- Step 6: Update package.json ---
echo "🔄 Updating $PACKAGE_JSON to v$NEW_VERSION..."
jq --arg v "$NEW_VERSION" '.version = $v' "$PACKAGE_JSON" >tmp.$$.json && mv tmp.$$.json "$PACKAGE_JSON"
TAG="v$NEW_VERSION"

# --- Step 7: Git Commit and push ---
git add "$CHANGELOG_FILE" "$PACKAGE_JSON"
git commit -m "chore(release): v$NEW_VERSION"
git tag -a "$TAG" -m "Release v$NEW_VERSION"
git push origin main
git push origin --tags

# --- Step 8: Create GitHub release ---
echo "☁️ Creating GitHub release..."
gh release create "$TAG" \
  --title "v$NEW_VERSION" \
  --notes-file "$CHANGELOG_FILE" \
  --repo "$REPO_NAME"

git branch -f released

echo "✅ Release v$NEW_VERSION complete!"
echo "📄 Changelog: $CHANGELOG_FILE"
echo "🔗 GitHub: https://github.com$(echo "$REPO_URL" | sed 's/.*github.com//')/releases/tag/$TAG"
