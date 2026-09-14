# Goal
Automate Google Search Console domain onboarding through TypeScript functions and this project's CLI using the Cloudflare API directly. Target live test: eventoren.de with Google profile work.

# Decisions
- Use existing dependencies and Result-based TypeScript conventions.
- Use CLOUDFLARE_API_TOKEN, matching existing local DNS scripts; do not invoke or modify scripts.
- Obtain a Google DNS_TXT verification token, preserve existing DNS records, ensure the exact TXT record exists, verify ownership, then add sc-domain:<domain> to Search Console.
- Support OAuth authorization with webmasters and siteverification.verify_only scopes.
- Never expose credentials. Use the user-selected work Google profile for live testing.

# Approach
Implement reusable API functions first, then CLI orchestration and documentation, then independent tests and a live attempt when credentials permit.

# Tasks
1. Completed: Implement tested TypeScript Cloudflare TXT and Google domain-verification/onboarding functions using existing auth and request patterns.
2. Completed: Expose onboarding in CLI, support required OAuth scopes, and document usage.
3. In progress: Independently verify changes and attempt eventoren.de onboarding with work if credentials are available.
