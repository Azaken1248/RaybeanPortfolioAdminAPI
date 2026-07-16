import { Router, type Request, type Response } from "express"
import type { Model } from "mongoose"
import type { ZodType } from "zod"
import { requireAuth } from "../middleware/auth.js"
import { validateBody } from "../middleware/validate.js"
import { writeLimiter } from "../middleware/rateLimit.js"
import { sortSchema } from "./validators.js"
import { NotFoundError } from "../utils/errors.js"

interface CrudOptions<T> {
  model: Model<T>
  /** Human name used in 404 messages. */
  resource: string
  createSchema: ZodType
  updateSchema: ZodType
  /**
   * Resources are addressed by their slug `id`, not the Mongo _id — that is
   * what the website and admin already reference, and it survives a re-seed.
   */
  lookupField?: string
}

/**
 * Every collection here has the same shape: list, read one, create, reorder,
 * update, delete. Writing it once means a new collection cannot accidentally
 * ship without auth, validation, or a sort endpoint.
 */
export function createCrudRouter<T>({
  model,
  resource,
  createSchema,
  updateSchema,
  lookupField = "id",
}: CrudOptions<T>): Router {
  const router = Router()
  const byKey = (key: string) => ({ [lookupField]: key }) as Record<string, unknown>

  router.get("/", async (_req: Request, res: Response) => {
    const docs = await model.find().sort({ sortOrder: 1 }).lean()
    res.json({ success: true, data: docs })
  })

  // Declared before "/:key" so the literal path is not swallowed by the param.
  router.put(
    "/sort",
    writeLimiter,
    requireAuth,
    validateBody(sortSchema),
    async (req: Request, res: Response) => {
      const { items } = req.body as { items: { id: string; sortOrder: number }[] }

      const operations = items.map(({ id, sortOrder }) => ({
        updateOne: { filter: byKey(id), update: { $set: { sortOrder } } },
      }))

      // The op shape is correct but does not survive Model<T>'s generic
      // inference, so it is asserted against this model's own signature.
      await model.bulkWrite(operations as Parameters<typeof model.bulkWrite>[0])

      const docs = await model.find().sort({ sortOrder: 1 }).lean()
      res.json({ success: true, data: docs })
    },
  )

  router.get("/:key", async (req: Request, res: Response) => {
    const doc = await model.findOne(byKey(req.params.key as string)).lean()
    if (!doc) throw new NotFoundError(resource)
    res.json({ success: true, data: doc })
  })

  router.post(
    "/",
    writeLimiter,
    requireAuth,
    validateBody(createSchema),
    async (req: Request, res: Response) => {
      const doc = await model.create(req.body)
      res.status(201).json({ success: true, data: doc })
    },
  )

  router.put(
    "/:key",
    writeLimiter,
    requireAuth,
    validateBody(updateSchema),
    async (req: Request, res: Response) => {
      const doc = await model
        .findOneAndUpdate(
          byKey(req.params.key as string),
          { $set: req.body as Record<string, unknown> },
          { returnDocument: "after", runValidators: true },
        )
        .lean()

      if (!doc) throw new NotFoundError(resource)
      res.json({ success: true, data: doc })
    },
  )

  router.delete(
    "/:key",
    writeLimiter,
    requireAuth,
    async (req: Request, res: Response) => {
      const doc = await model.findOneAndDelete(byKey(req.params.key as string)).lean()
      if (!doc) throw new NotFoundError(resource)
      res.json({ success: true, data: { message: `${resource} deleted` } })
    },
  )

  return router
}
