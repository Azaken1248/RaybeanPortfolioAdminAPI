import rateLimit from "express-rate-limit"
import { env } from "../config/env.js"

const disabled = (): boolean => env.IS_TEST

/** Generous: the public site may poll this from every visitor. */
export const publicLimiter = rateLimit({
  windowMs: 60_000,
  limit: 120,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  skip: disabled,
  message: { success: false, error: { code: "RATE_LIMITED", message: "Too many requests" } },
})

/** Tight: login is the one endpoint worth brute-forcing. */
export const authLimiter = rateLimit({
  windowMs: 15 * 60_000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  skip: disabled,
  message: { success: false, error: { code: "RATE_LIMITED", message: "Too many auth attempts" } },
})

/** Uploads cost CPU (sharp) and money (Cloudinary). */
export const uploadLimiter = rateLimit({
  windowMs: 60_000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  skip: disabled,
  message: { success: false, error: { code: "RATE_LIMITED", message: "Too many uploads" } },
})

/** Everything else that writes. */
export const writeLimiter = rateLimit({
  windowMs: 60_000,
  limit: 60,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  skip: disabled,
  message: { success: false, error: { code: "RATE_LIMITED", message: "Too many requests" } },
})
