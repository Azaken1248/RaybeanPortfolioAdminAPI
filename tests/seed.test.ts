import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import { CommissionTier, Discipline, GlobalConfig, Work } from "../src/models/index.js"

interface Fixture {
  globalConfig: Record<string, unknown>
  disciplines: Record<string, unknown>[]
  works: Record<string, unknown>[]
  commissionTiers: Record<string, unknown>[]
}

const seedData = JSON.parse(readFileSync("src/seedData.json", "utf8")) as Fixture

/**
 * The seed fixture is the real content of the live site. If the models cannot
 * store it, the API cannot serve the site — so validate it against the schemas
 * rather than against invented fixtures. This is what caught `section.title: ""`
 * being rejected by a `required` String.
 */
describe("Seed fixture", () => {
  it("inserts the real site content without validation errors", async () => {
    await expect(GlobalConfig.create(seedData.globalConfig)).resolves.toBeDefined()
    await expect(Discipline.insertMany(seedData.disciplines)).resolves.toHaveLength(
      seedData.disciplines.length,
    )
    await expect(Work.insertMany(seedData.works)).resolves.toHaveLength(
      seedData.works.length,
    )
    if (seedData.commissionTiers.length > 0) {
      await CommissionTier.insertMany(seedData.commissionTiers)
    }
  })

  it("round-trips through the portfolio aggregate unchanged", async () => {
    await GlobalConfig.create(seedData.globalConfig)
    await Discipline.insertMany(seedData.disciplines)
    await Work.insertMany(seedData.works)

    const works = await Work.find().sort({ sortOrder: 1 }).lean()
    expect(works).toHaveLength(seedData.works.length)

    // The aspect-ratio fix depends on these surviving the round trip. Every
    // image work must carry them: one slipped through when the generator's
    // regex missed a path that prettier had wrapped onto its own line.
    const noDims = works
      .filter((w) => w.medium === "image" && !(w.width && w.height))
      .map((w) => w.id)
    expect(noDims).toEqual([])

    // The illustration group's empty heading must survive too.
    const illustration = await Discipline.findOne({ id: "illustration" }).lean()
    expect(illustration?.groups[0]?.section.title).toBe("")
  })

  it("every work points at a discipline that exists", async () => {
    const ids = new Set(seedData.disciplines.map((d) => d.id as string))
    const orphans = seedData.works.filter((w) => !ids.has(w.discipline as string))
    expect(orphans).toEqual([])
  })

  it("every work sits in a group its discipline declares", async () => {
    const groups = new Map(
      seedData.disciplines.map((d) => [
        d.id as string,
        new Set((d.groups as { id: string }[]).map((g) => g.id)),
      ]),
    )
    const orphans = seedData.works
      .filter((w) => !groups.get(w.discipline as string)?.has(w.group as string))
      .map((w) => `${w.id as string} -> ${w.discipline as string}/${w.group as string}`)
    expect(orphans).toEqual([])
  })
})
