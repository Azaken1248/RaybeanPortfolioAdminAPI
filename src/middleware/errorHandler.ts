import type { NextFunction, Request, Response } from "express"
import { MulterError } from "multer"
import { ZodError } from "zod"
import { AppError } from "../utils/errors.js"
import { logger } from "../utils/logger.js"
import { env } from "../config/env.js"

interface ErrorBody {
  success: false
  error: {
    code: string
    message: string
    details?: unknown
    stack?: string
  }
}

function send(
  res: Response,
  status: number,
  code: string,
  message: string,
  details?: unknown,
  stack?: string,
): void {
  const body: ErrorBody = { success: false, error: { code, message } }
  if (details !== undefined) body.error.details = details
  if (stack && !env.IS_PRODUCTION) body.error.stack = stack
  res.status(status).json(body)
}

/**
 * The single place an error becomes a response. Every thrown error leaves here
 * in the same envelope the client already understands:
 *   { success: false, error: { code, message } }
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof ZodError) {
    send(res, 400, "VALIDATION_ERROR", "Request body failed validation", err.issues)
    return
  }

  if (err instanceof MulterError) {
    const tooBig = err.code === "LIMIT_FILE_SIZE"
    send(
      res,
      tooBig ? 413 : 400,
      tooBig ? "PAYLOAD_TOO_LARGE" : "UPLOAD_ERROR",
      err.message,
    )
    return
  }

  if (err.name === "ValidationError") {
    send(res, 400, "VALIDATION_ERROR", err.message)
    return
  }

  if (err.name === "CastError") {
    send(res, 400, "INVALID_ID", "Invalid resource ID format")
    return
  }

  if ("code" in err && (err as { code?: unknown }).code === 11000) {
    send(res, 409, "DUPLICATE_KEY", "Resource already exists")
    return
  }

  if (err instanceof AppError) {
    if (!err.isOperational) {
      logger.error("[FATAL] Non-operational error:", err.message, err.stack)
    }
    send(res, err.statusCode, err.code, err.message, err.details, err.stack)
    return
  }

  // Anything reaching here is unexpected: log it in full, but never leak
  // internals to the client in production.
  logger.error("[UNHANDLED]", err.message, err.stack)
  send(
    res,
    500,
    "INTERNAL_ERROR",
    env.IS_PRODUCTION ? "An unexpected error occurred" : err.message,
    undefined,
    err.stack,
  )
}
