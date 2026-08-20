import * as v from "valibot"

export const googleSearchConsoleApiErrorResponseSchema = v.object({
  error: v.looseObject({
    code: v.number(),
    message: v.pipe(v.string(), v.minLength(1)),
    status: v.optional(v.string()),
    errors: v.optional(
      v.array(
        v.looseObject({
          message: v.optional(v.string()),
          domain: v.optional(v.string()),
          reason: v.optional(v.string()),
          location: v.optional(v.string()),
          locationType: v.optional(v.string()),
        }),
      ),
    ),
    details: v.optional(v.unknown()),
  }),
})

export type GoogleSearchConsoleApiErrorResponse = v.InferOutput<typeof googleSearchConsoleApiErrorResponseSchema>
