export function googleSearchConsoleOAuthScopeMatches(grantedScope: string, requiredScope: string): boolean {
  const granted = new Set(grantedScope.split(/\s+/).filter((scope) => scope.length > 0))
  const required = new Set(requiredScope.split(/\s+/).filter((scope) => scope.length > 0))
  if (granted.size !== required.size) return false
  return [...required].every((scope) => granted.has(scope))
}
