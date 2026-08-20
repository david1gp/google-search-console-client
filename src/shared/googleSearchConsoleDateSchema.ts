import * as v from "valibot"

export const googleSearchConsoleDateSchema = v.pipe(
  v.string(),
  v.regex(/^\d{4}-\d{2}-\d{2}$/, "must use YYYY-MM-DD format"),
  v.check((value) => {
    const [year, month, day] = value.split("-").map(Number)
    const date = new Date(Date.UTC(year ?? 0, (month ?? 0) - 1, day ?? 0))
    return date.getUTCFullYear() === year && date.getUTCMonth() === (month ?? 0) - 1 && date.getUTCDate() === day
  }, "must be a valid calendar date"),
)
