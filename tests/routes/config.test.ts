import request from "supertest"
import { describe, expect, it } from "vitest"
import { createApp } from "../../src/app.js"
import { GlobalConfig } from "../../src/models/index.js"
import { authCookie, validConfig } from "../helpers.js"

const app = createApp()

describe("Config routes", () => {
  it("404s when no config exists", async () => {
    const res = await request(app).get("/api/config")
    expect(res.status).toBe(404)
  })

  it("returns the singleton config", async () => {
    await GlobalConfig.create(validConfig)
    const res = await request(app).get("/api/config")
    expect(res.status).toBe(200)
    expect(res.body.data.siteConfig.siteName).toBe("Raybean")
  })

  it("requires auth to patch", async () => {
    await GlobalConfig.create(validConfig)
    const res = await request(app).patch("/api/config").send({ featuredSection: { title: "x" } })
    expect(res.status).toBe(401)
  })

  it("patches one slice without resending the whole document", async () => {
    await GlobalConfig.create(validConfig)

    const res = await request(app)
      .patch("/api/config")
      .set("Cookie", authCookie())
      .send({ featuredSection: { title: "My Best Work" } })

    expect(res.status).toBe(200)
    expect(res.body.data.featuredSection.title).toBe("My Best Work")
    // untouched slices survive
    expect(res.body.data.siteConfig.siteName).toBe("Raybean")
    expect(res.body.data.heroContent.greeting).toBe("Hello, I'm Raybean!")
  })

  it("rejects unknown keys", async () => {
    await GlobalConfig.create(validConfig)
    const res = await request(app)
      .patch("/api/config")
      .set("Cookie", authCookie())
      .send({ nonsense: true })
    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe("VALIDATION_ERROR")
  })

  it("rejects a malformed seo url", async () => {
    await GlobalConfig.create(validConfig)
    const res = await request(app)
      .patch("/api/config")
      .set("Cookie", authCookie())
      .send({ siteConfig: { ...validConfig.siteConfig, seo: { ...validConfig.siteConfig.seo, url: "not-a-url" } } })
    expect(res.status).toBe(400)
  })
})

describe("Theme", () => {
  it("serves the palette and fonts through the portfolio aggregate", async () => {
    await GlobalConfig.create(validConfig)
    const res = await request(app).get("/api/portfolio")
    expect(res.body.data.siteConfig.theme.colors.ink).toBe("#464646")
    expect(res.body.data.siteConfig.theme.fonts.display).toBe("Poppins")
  })

  it("updates the palette", async () => {
    await GlobalConfig.create(validConfig)
    const res = await request(app)
      .patch("/api/config")
      .set("Cookie", authCookie())
      .send({
        siteConfig: {
          ...validConfig.siteConfig,
          theme: {
            ...validConfig.siteConfig.theme,
            colors: { ...validConfig.siteConfig.theme.colors, ink: "#111111" },
          },
        },
      })

    expect(res.status).toBe(200)
    expect(res.body.data.siteConfig.theme.colors.ink).toBe("#111111")
  })

  it("rejects a colour that is not a colour", async () => {
    await GlobalConfig.create(validConfig)
    const res = await request(app)
      .patch("/api/config")
      .set("Cookie", authCookie())
      .send({
        siteConfig: {
          ...validConfig.siteConfig,
          theme: {
            ...validConfig.siteConfig.theme,
            colors: { ...validConfig.siteConfig.theme.colors, ink: "definitely-not-a-colour" },
          },
        },
      })
    expect(res.status).toBe(400)
  })

  it("treats an absent theme as valid — the site falls back to its own CSS", async () => {
    const { theme, ...siteConfig } = validConfig.siteConfig
    void theme
    await expect(
      GlobalConfig.create({ ...validConfig, siteConfig }),
    ).resolves.toBeDefined()
  })
})
