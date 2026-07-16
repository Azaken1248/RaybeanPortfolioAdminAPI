import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import mongoose from "mongoose"
import { connectDB, disconnectDB } from "./config/db.js"
import { CommissionTier, Discipline, GlobalConfig, Work } from "./models/index.js"
import { logger } from "./utils/logger.js"

/**
 * Seeds the database with exactly what the public site currently renders.
 * `seedData.json` was generated from BeanPortfolioWebsite's portfolio.ts, so a
 * seeded database plus VITE_PORTFOLIO_API_URL reproduces the site as-is —
 * which is what makes the local-to-API switch verifiable rather than hopeful.
 *
 * Destructive: pass --force to run against a non-empty database.
 */
interface SeedFixture {
  globalConfig: Record<string, unknown>
  disciplines: Record<string, unknown>[]
  works: Record<string, unknown>[]
  commissionTiers: Record<string, unknown>[]
}

const seedData = JSON.parse(
  readFileSync(join(dirname(fileURLToPath(import.meta.url)), "seedData.json"), "utf8"),
) as SeedFixture

async function seed(): Promise<void> {
  const force = process.argv.includes("--force")

  await connectDB()

  const existing = await Work.estimatedDocumentCount()
  if (existing > 0 && !force) {
    logger.warn(
      `[SEED] Database already holds ${existing} works. Re-run with --force to wipe and reseed.`,
    )
    await disconnectDB()
    process.exit(1)
  }

  logger.info("[SEED] Clearing collections")
  await Promise.all([
    GlobalConfig.deleteMany({}),
    Discipline.deleteMany({}),
    Work.deleteMany({}),
    CommissionTier.deleteMany({}),
  ])

  logger.info("[SEED] Inserting")
  await GlobalConfig.create(seedData.globalConfig)
  await Discipline.insertMany(seedData.disciplines)
  await Work.insertMany(seedData.works)
  if (seedData.commissionTiers.length > 0) {
    await CommissionTier.insertMany(seedData.commissionTiers)
  }

  logger.info(
    `[SEED] Done: ${seedData.disciplines.length} disciplines, ${seedData.works.length} works, ${seedData.commissionTiers.length} tiers`,
  )

  await disconnectDB()
}

seed().catch(async (error: unknown) => {
  logger.error("[SEED] Failed:", error)
  await mongoose.disconnect().catch(() => undefined)
  process.exit(1)
})
