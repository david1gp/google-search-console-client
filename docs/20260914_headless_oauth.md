# Goal
Provide a streamlined CLI OAuth flow on servers: display an authorization URL and the next command into which the user pastes the browser callback URL.

# Decisions
- Add auth login --headless for human-readable instructions without browser launching.
- Preserve existing default and --agent JSON behavior.
- Reuse existing pending-state and callback completion flow, credentials/profile resolution, and dependencies.
- Display a bunx completion command pinned to the running package version so it works without a globally installed CLI.

# Approach
Format the existing OAuth handoff as readable steps with the full authorization URL and a quoted callback placeholder. Include onboarding usage in documentation.

# Tasks
1. Completed: Implement --headless output, CLI help, regression tests, and README usage.
2. Completed: Independently verify headless instructions and existing JSON compatibility.
