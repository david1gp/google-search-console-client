export function googleSearchConsoleAccessTokenRedact(accessTokens: Iterable<string>, text: string): string {
  let redactedText = text
  const nonEmptyAccessTokens = Array.from(accessTokens)
    .filter((accessToken) => accessToken.length > 0)
    .sort((left, right) => right.length - left.length)
  for (const accessToken of nonEmptyAccessTokens) {
    redactedText = redactedText.replaceAll(accessToken, "[REDACTED]")
  }
  return redactedText
}
