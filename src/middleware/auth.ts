import type { NextFunction, Request, Response } from "express"
import jwt from "jsonwebtoken"
import { env } from "../config/env.js"
import { UnauthorizedError } from "../utils/errors.js"
import type { JwtPayload } from "../types/auth.js"

export const AUTH_COOKIE = "token"

/**
 * Gate for every mutating route. The token is read from an httpOnly cookie, so
 * page scripts cannot exfiltrate it; combined with sameSite=lax, a cross-site
 * form post cannot ride along either.
 */
export function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const token: unknown = (req.cookies as Record<string, unknown> | undefined)?.[
    AUTH_COOKIE
  ]

  if (typeof token !== "string" || token.length === 0) {
    next(new UnauthorizedError("Authentication required"))
    return
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload

    // A token signed for someone since removed from the allowlist must stop
    // working immediately, not linger until it expires.
    if (!env.ALLOWED_DISCORD_IDS.includes(decoded.discordId)) {
      next(new UnauthorizedError("Account is no longer authorised"))
      return
    }

    ;(req as Request & { user: JwtPayload }).user = {
      discordId: decoded.discordId,
      username: decoded.username,
      avatar: decoded.avatar,
      role: "admin",
    }
    next()
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      next(new UnauthorizedError("Token expired"))
      return
    }
    if (err instanceof jwt.JsonWebTokenError) {
      next(new UnauthorizedError("Invalid token"))
      return
    }
    next(new UnauthorizedError("Authentication failed"))
  }
}
