import { Router, type Request, type Response } from "express"
import { CommissionTier, Discipline, GlobalConfig, Work } from "../models/index.js"
import { NotFoundError } from "../utils/errors.js"

const router = Router()

/**
 * GET /api/portfolio — the whole site in one request.
 *
 * This is the ONLY endpoint the public website calls, and its shape is the
 * contract described by `apiTypes.ts` in BeanPortfolioWebsite. The website's
 * adapter maps this onto its domain model; if a field is dropped here, the site
 * silently loses it.
 */
router.get("/", async (_req: Request, res: Response) => {
  const [config, disciplines, works, commissionTiers] = await Promise.all([
    GlobalConfig.findOne().lean(),
    Discipline.find().sort({ sortOrder: 1 }).lean(),
    Work.find().sort({ sortOrder: 1 }).lean(),
    CommissionTier.find().sort({ sortOrder: 1 }).lean(),
  ])

  if (!config) {
    throw new NotFoundError("GlobalConfig — run `npm run seed`")
  }

  res.json({
    success: true,
    data: { ...config, disciplines, works, commissionTiers },
  })
})

export { router as portfolioRouter }
