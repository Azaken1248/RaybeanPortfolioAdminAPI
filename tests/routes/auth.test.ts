import request from "supertest"
import { describe, expect, it } from "vitest"
import { createApp } from "../../src/app.js"
import { authCookie } from "../helpers.js"

const app = createApp()

/** supertest types set-cookie as string, but Node sends string[]. */
function cookies(res: { headers: Record<string, unknown> }): string {
  const raw = res.headers["set-cookie"]
  return Array.isArray(raw) ? raw.join(";") : String(raw ?? "")
}

describe("Auth routes", () => {
  it("redirects to Discord with a state parameter", async () => {
    const res = await request(app).get("/api/auth/discord")
    expect(res.status).toBe(302)
    expect(res.headers.location).toContain("discord.com")
    expect(res.headers.location).toContain("state=")
    // the state must also be stored for the callback to compare against
    expect(cookies(res)).toContain("oauth_state")
  })

  it("rejects a callback with no state cookie (CSRF guard)", async () => {
    const res = await request(app).get("/api/auth/discord/callback?code=abc&state=xyz")
    expect(res.status).toBe(302)
    expect(res.headers.location).toContain("error=invalid_state")
  })

  it("rejects a callback with no code", async () => {
    const res = await request(app).get("/api/auth/discord/callback")
    expect(res.status).toBe(302)
    expect(res.headers.location).toContain("error=missing_code")
  })

  it("returns the current user for a valid session", async () => {
    const res = await request(app).get("/api/auth/me").set("Cookie", authCookie())
    expect(res.status).toBe(200)
    expect(res.body.data.discordId).toBe("123456789")
    expect(res.body.data.role).toBe("admin")
  })

  it("401s /me without a session", async () => {
    const res = await request(app).get("/api/auth/me")
    expect(res.status).toBe(401)
  })

  it("clears the cookie on logout", async () => {
    const res = await request(app).post("/api/auth/logout")
    expect(res.status).toBe(200)
    expect(cookies(res)).toContain("token=;")
  })
})
