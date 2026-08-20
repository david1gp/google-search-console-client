import * as v from "valibot"
import { googleSearchConsoleDateSchema } from "./googleSearchConsoleDateSchema.js"

export const googleSearchConsoleDatetimeSchema = v.pipe(
  v.string(),
  v.check(googleSearchConsoleDatetimeIsValid, "must be a valid RFC 3339 date-time"),
)

function googleSearchConsoleDatetimeIsValid(value: string): boolean {
  const match = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(Z|[+-]\d{2}:\d{2})$/.exec(value)
  if (match === null) return false

  const [, date, hour, minute, second, offset] = match
  if (
    date === undefined ||
    hour === undefined ||
    minute === undefined ||
    second === undefined ||
    offset === undefined
  ) {
    return false
  }
  if (!v.safeParse(googleSearchConsoleDateSchema, date).success) return false

  const timeIsValid = Number(hour) <= 23 && Number(minute) <= 59 && Number(second) <= 59
  if (!timeIsValid) return false
  if (offset === "Z") return true

  const offsetMatch = /^[+-](\d{2}):(\d{2})$/.exec(offset)
  if (offsetMatch === null) return false
  const [, offsetHour, offsetMinute] = offsetMatch
  return (
    offsetHour !== undefined && offsetMinute !== undefined && Number(offsetHour) <= 23 && Number(offsetMinute) <= 59
  )
}
