import request from "supertest"
import { describe, expect, it } from "vitest"
import { createApp } from "../../src/app.js"
import { CommissionTier, Discipline, GlobalConfig, Work } from "../../src/models/index.js"
import { validConfig, validWork } from "../helpers.js"

const app = createApp()

describe("GET /api/portfolio", () => {
  it("404s with a useful hint when unseeded", async () => {
    const res = await request(app).get("/api/portfolio")
    expect(res.status).toBe(404)
    expect(res.body.error.message).toContain("seed")
  })

  it("returns the whole site in one aggregate", async () => {
    await GlobalConfig.create(validConfig)
    await Discipline.create({
      id: "illustration",
      route: "/illustration",
      navLabel: "illustration",
      section: { title: "illustration" },
      groups: [{ id: "best-works", section: { title: "" }, layout: "masonry" }],
      sortOrder: 1,
    })
    await Work.create(validWork)
    await CommissionTier.create({
      id: "sketch",
      name: "Sketch",
      priceLabel: "$10",
      description: "A sketch",
      sortOrder: 0,
    })

    const res = await request(app).get("/api/portfolio")
    expect(res.status).toBe(200)

    const { data } = res.body
    // Every key the website's adapter reads must be present.
    for (const key of [
      "siteConfig",
      "nav",
      "socials",
      "heroContent",
      "featuredSection",
      "disciplines",
      "works",
      "commissions",
      "commissionTiers",
      "contactContent",
      "footerContent",
    ]) {
      expect(data, `missing key: ${key}`).toHaveProperty(key)
    }

    expect(data.works).toHaveLength(1)
    expect(data.disciplines).toHaveLength(1)
    expect(data.commissionTiers).toHaveLength(1)
  })

  it("is public — no auth required", async () => {
    await GlobalConfig.create(validConfig)
    const res = await request(app).get("/api/portfolio")
    expect(res.status).toBe(200)
  })

  it("carries width, height and imageCredit through (the site needs them)", async () => {
    await GlobalConfig.create({
      ...validConfig,
      heroContent: {
        ...validConfig.heroContent,
        imageCredit: { text: "Art by Dreamxiety!", href: "https://osu.ppy.sh/users/13103233" },
      },
    })
    await Work.create({ ...validWork, width: 1081, height: 1600 })

    const res = await request(app).get("/api/portfolio")
    expect(res.body.data.heroContent.imageCredit.text).toBe("Art by Dreamxiety!")
    expect(res.body.data.works[0].width).toBe(1081)
    expect(res.body.data.works[0].height).toBe(1600)
  })
})
