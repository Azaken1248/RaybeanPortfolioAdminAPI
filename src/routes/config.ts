import { Router, type Request, type Response } from "express"
import { GlobalConfig } from "../models/index.js"
import { requireAuth } from "../middleware/auth.js"
import { validateBody } from "../middleware/validate.js"
import { writeLimiter } from "../middleware/rateLimit.js"
import { configUpdateSchema } from "./validators.js"
import { NotFoundError } from "../utils/errors.js"

const router = Router()

router.get("/", async (_req: Request, res: Response) => {
  const config = await GlobalConfig.findOne().lean()
  if (!config) throw new NotFoundError("GlobalConfig")
  res.json({ success: true, data: config })
})

/**
 * PATCH, not PUT: the admin edits one panel at a time (hero, socials, footer…)
 * and must never have to resend the whole document to change a single string.
 * $set merges only the keys provided.
 */
router.patch(
  "/",
  writeLimiter,
  requireAuth,
  validateBody(configUpdateSchema),
  async (req: Request, res: Response) => {
    const config = await GlobalConfig.findOneAndUpdate(
      {},
      { $set: req.body as Record<string, unknown> },
      { returnDocument: "after", runValidators: true },
    ).lean()

    if (!config) throw new NotFoundError("GlobalConfig")
    res.json({ success: true, data: config })
  },
)

export { router as configRouter }
