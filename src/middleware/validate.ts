import type { NextFunction, Request, Response } from "express"
import type { ZodType } from "zod"

/**
 * Parses and REPLACES req.body with the schema's output, so a handler can only
 * ever see fields the schema declares. That is what stops a client from
 * smuggling extra keys into a Mongoose write.
 */
export function validateBody<T>(schema: ZodType<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body)
    if (!result.success) {
      next(result.error)
      return
    }
    req.body = result.data
    next()
  }
}
