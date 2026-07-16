import request from "supertest"
import { describe, expect, it } from "vitest"
import { createApp } from "../../src/app.js"
import { Work } from "../../src/models/index.js"
import { authCookie, validWork } from "../helpers.js"

const app = createApp()

describe("Works routes", () => {
  describe("GET /api/works", () => {
    it("returns an empty list when there are no works", async () => {
      const res = await request(app).get("/api/works")
      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data).toEqual([])
    })

    it("returns works ordered by sortOrder", async () => {
      await Work.create([
        { ...validWork, id: "c", sortOrder: 2 },
        { ...validWork, id: "a", sortOrder: 0 },
        { ...validWork, id: "b", sortOrder: 1 },
      ])

      const res = await request(app).get("/api/works")
      expect(res.body.data.map((w: { id: string }) => w.id)).toEqual(["a", "b", "c"])
    })
  })

  describe("GET /api/works/:key", () => {
    it("looks a work up by its slug, not its _id", async () => {
      await Work.create(validWork)
      const res = await request(app).get("/api/works/test-work")
      expect(res.status).toBe(200)
      expect(res.body.data.title).toBe("Test Work")
    })

    it("404s for an unknown slug", async () => {
      const res = await request(app).get("/api/works/nope")
      expect(res.status).toBe(404)
      expect(res.body.error.code).toBe("NOT_FOUND")
    })
  })

  describe("auth", () => {
    it("rejects an unauthenticated create", async () => {
      const res = await request(app).post("/api/works").send(validWork)
      expect(res.status).toBe(401)
      expect(await Work.countDocuments()).toBe(0)
    })

    it("rejects a forged token", async () => {
      const res = await request(app)
        .post("/api/works")
        .set("Cookie", "token=not-a-real-jwt")
        .send(validWork)
      expect(res.status).toBe(401)
    })

    it("rejects a validly-signed token for a non-allowlisted user", async () => {
      const res = await request(app)
        .post("/api/works")
        .set("Cookie", authCookie("000000000"))
        .send(validWork)
      expect(res.status).toBe(401)
    })
  })

  describe("POST /api/works", () => {
    it("creates a work when authenticated", async () => {
      const res = await request(app)
        .post("/api/works")
        .set("Cookie", authCookie())
        .send(validWork)

      expect(res.status).toBe(201)
      expect(res.body.data.id).toBe("test-work")
      expect(await Work.countDocuments()).toBe(1)
    })

    it("rejects an unknown field instead of silently dropping it", async () => {
      const res = await request(app)
        .post("/api/works")
        .set("Cookie", authCookie())
        .send({ ...validWork, isAdmin: true })

      expect(res.status).toBe(400)
      expect(res.body.error.code).toBe("VALIDATION_ERROR")
    })

    it("rejects a non-kebab-case id", async () => {
      const res = await request(app)
        .post("/api/works")
        .set("Cookie", authCookie())
        .send({ ...validWork, id: "Not Valid" })
      expect(res.status).toBe(400)
    })

    it("rejects a duplicate id", async () => {
      await Work.create(validWork)
      const res = await request(app)
        .post("/api/works")
        .set("Cookie", authCookie())
        .send(validWork)
      expect(res.status).toBe(409)
      expect(res.body.error.code).toBe("DUPLICATE_KEY")
    })

    it("rejects an invalid discipline", async () => {
      const res = await request(app)
        .post("/api/works")
        .set("Cookie", authCookie())
        .send({ ...validWork, discipline: "cooking" })
      expect(res.status).toBe(400)
    })
  })

  describe("PUT /api/works/sort", () => {
    it("reorders in one round trip", async () => {
      await Work.create([
        { ...validWork, id: "a", sortOrder: 0 },
        { ...validWork, id: "b", sortOrder: 1 },
      ])

      const res = await request(app)
        .put("/api/works/sort")
        .set("Cookie", authCookie())
        .send({ items: [{ id: "a", sortOrder: 1 }, { id: "b", sortOrder: 0 }] })

      expect(res.status).toBe(200)
      expect(res.body.data.map((w: { id: string }) => w.id)).toEqual(["b", "a"])
    })

    it("is not shadowed by the :key route", async () => {
      const res = await request(app).put("/api/works/sort").send({ items: [] })
      // 401 (auth first), never 404 — proving /sort resolves before /:key
      expect(res.status).toBe(401)
    })
  })

  describe("PUT/DELETE /api/works/:key", () => {
    it("updates a work", async () => {
      await Work.create(validWork)
      const res = await request(app)
        .put("/api/works/test-work")
        .set("Cookie", authCookie())
        .send({ title: "Renamed" })

      expect(res.status).toBe(200)
      expect(res.body.data.title).toBe("Renamed")
    })

    it("deletes a work", async () => {
      await Work.create(validWork)
      const res = await request(app)
        .delete("/api/works/test-work")
        .set("Cookie", authCookie())

      expect(res.status).toBe(200)
      expect(await Work.countDocuments()).toBe(0)
    })

    it("404s deleting something that is not there", async () => {
      const res = await request(app)
        .delete("/api/works/ghost")
        .set("Cookie", authCookie())
      expect(res.status).toBe(404)
    })
  })
})
