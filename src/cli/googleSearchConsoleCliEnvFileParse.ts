import { createResult, createResultError, type Result } from "#result"

export function googleSearchConsoleCliEnvFileParse(text: string): Result<Record<string, string>> {
  const op = "googleSearchConsoleCliEnvFileParse"
  const values: Record<string, string> = {}

  for (const [index, sourceLine] of text.split(/\r?\n/).entries()) {
    const line = sourceLine.replace(/^\uFEFF/, "").trim()
    if (line === "" || line.startsWith("#")) continue

    const match = /^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(line)
    if (!match) return createResultError(op, `Invalid .env entry on line ${index + 1}`)

    const key = match[1]
    const rawValueSource = match[2]
    if (key === undefined || rawValueSource === undefined) {
      return createResultError(op, `Invalid .env entry on line ${index + 1}`)
    }

    const rawValue = rawValueSource.trim()
    const quote = rawValue[0]
    if (quote === "'" || quote === '"') {
      if (rawValue.length < 2 || rawValue.at(-1) !== quote) {
        return createResultError(op, `Unclosed quote on line ${index + 1}`)
      }
      values[key] = rawValue.slice(1, -1)
      continue
    }

    values[key] = rawValue.replace(/\s+#.*$/, "").trim()
  }

  return createResult(values)
}
