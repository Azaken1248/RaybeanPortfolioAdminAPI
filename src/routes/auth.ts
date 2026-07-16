import crypto from "node:crypto"
import { Router, type Request, type Response } from "express"
import jwt from "jsonwebtoken"
import { env } from "../config/env.js"
import { AUTH_COOKIE, requireAuth } from "../middleware/auth.js"
import { authLimiter } from "../middleware/rateLimit.js"
import { logger } from "../utils/logger.js"
import type {
  AuthenticatedRequest,
  DiscordTokenResponse,
  DiscordUser,
  JwtPayload,
} from "../types/auth.js"

const DISCORD_API = "https://discord.com/api/v10"
const DISCORD_AUTHORIZE = "https://discord.com/oauth2/authorize"
const SESSION_MAX_AGE = 7 * 24 * 60 * 60 * 1000
const STATE_COOKIE = "oauth_state"
const STATE_MAX_AGE = 10 * 60 * 1000

const router = Router()

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: env.IS_PRODUCTION,
    sameSite: "lax" as const,
    maxAge,
    path: "/",
  }
}

function fail(res: Response, reason: string): void {
  res.redirect(`${env.CLIENT_URL}/login?error=${reason}`)
}

/**
 * Step 1 — hand the browser to Discord.
 *
 * A random `state` is stored in a short-lived cookie and echoed back by
 * Discord. Without it, an attacker could feed the callback their own code and
 * log the admin into the attacker's account (login CSRF).
 */
router.get("/discord", authLimiter, (_req: Request, res: Response) => {
  const state = crypto.randomBytes(32).toString("hex")

  res.cookie(STATE_COOKIE, state, cookieOptions(STATE_MAX_AGE))
  res.redirect(
    `${DISCORD_AUTHORIZE}?${new URLSearchParams({
      client_id: env.DISCORD_CLIENT_ID,
      redirect_uri: env.DISCORD_REDIRECT_URI,
      response_type: "code",
      scope: "identify",
      state,
    }).toString()}`,
  )
})

/** Step 2 — Discord sends the user back with a code. */
router.get("/discord/callback", authLimiter, async (req: Request, res: Response) => {
  const { code, state } = req.query
  const expectedState = (req.cookies as Record<string, string> | undefined)?.[STATE_COOKIE]

  res.clearCookie(STATE_COOKIE, { path: "/" })

  if (typeof code !== "string" || code.length === 0) {
    fail(res, "missing_code")
    return
  }

  if (
    typeof state !== "string" ||
    !expectedState ||
    state.length !== expectedState.length ||
    !crypto.timingSafeEqual(Buffer.from(state), Buffer.from(expectedState))
  ) {
    logger.warn("[AUTH] OAuth state mismatch — possible CSRF attempt")
    fail(res, "invalid_state")
    return
  }

  try {
    const tokenRes = await fetch(`${DISCORD_API}/oauth2/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: env.DISCORD_CLIENT_ID,
        client_secret: env.DISCORD_CLIENT_SECRET,
        grant_type: "authorization_code",
        code,
        redirect_uri: env.DISCORD_REDIRECT_URI,
      }),
    })

    if (!tokenRes.ok) {
      logger.error("[AUTH] Token exchange failed:", tokenRes.status)
      fail(res, "discord_error")
      return
    }

    const tokenData = (await tokenRes.json()) as DiscordTokenResponse

    const userRes = await fetch(`${DISCORD_API}/users/@me`, {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    })

    if (!userRes.ok) {
      logger.error("[AUTH] User fetch failed:", userRes.status)
      fail(res, "discord_error")
      return
    }

    const discordUser = (await userRes.json()) as DiscordUser

    // The allowlist is the entire authorisation model: Discord proves who you
    // are, this decides whether that person may edit the site.
    if (!env.ALLOWED_DISCORD_IDS.includes(discordUser.id)) {
      logger.warn("[AUTH] Rejected login for Discord id:", discordUser.id)
      fail(res, "unauthorized")
      return
    }

    const payload: JwtPayload = {
      discordId: discordUser.id,
      username: discordUser.username,
      avatar: discordUser.avatar,
      role: "admin",
    }

    res.cookie(
      AUTH_COOKIE,
      jwt.sign(payload, env.JWT_SECRET, { expiresIn: "7d" }),
      cookieOptions(SESSION_MAX_AGE),
    )
    res.redirect(`${env.CLIENT_URL}/admin`)
  } catch (err) {
    logger.error("[AUTH] Callback error:", err)
    fail(res, "discord_error")
  }
})

router.get("/me", requireAuth, (req: Request, res: Response) => {
  res.json({ success: true, data: (req as AuthenticatedRequest).user })
})

router.post("/logout", (_req: Request, res: Response) => {
  res.clearCookie(AUTH_COOKIE, {
    httpOnly: true,
    secure: env.IS_PRODUCTION,
    sameSite: "lax",
    path: "/",
  })
  res.json({ success: true, data: { message: "Logged out" } })
})

export { router as authRouter }
