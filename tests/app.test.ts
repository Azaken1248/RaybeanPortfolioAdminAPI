import request from "supertest"
import { describe, expect, it } from "vitest"
import { createApp } from "../src/app.js"

const app = createApp()

describe("App", () => {
  it("reports health", async () => {
    const res = await request(app).get("/api/health")
    expect(res.status).toBe(200)
    expect(res.body.data.status).toBe("healthy")
  })

  it("404s an unknown route in the standard envelope", async () => {
    const res = await request(app).get("/api/nope")
    expect(res.status).toBe(404)
    expect(res.body).toMatchObject({ success: false, error: { code: "NOT_FOUND" } })
  })

  it("sets security headers", async () => {
    const res = await request(app).get("/api/health")
    expect(res.headers["x-powered-by"]).toBeUndefined()
    expect(res.headers["x-content-type-options"]).toBe("nosniff")
  })

  it("allows a configured origin", async () => {
    const res = await request(app)
      .get("/api/health")
      .set("Origin", "http://localhost:5173")
    expect(res.headers["access-control-allow-origin"]).toBe("http://localhost:5173")
  })

  it("does not grant CORS to an unknown origin", async () => {
    const res = await request(app)
      .get("/api/health")
      .set("Origin", "https://evil.example.com")
    expect(res.headers["access-control-allow-origin"]).toBeUndefined()
  })
})
