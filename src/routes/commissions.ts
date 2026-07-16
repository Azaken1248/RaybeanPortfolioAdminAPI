import { CommissionTier } from "../models/index.js"
import { createCrudRouter } from "./crudRouter.js"
import { tierCreateSchema, tierUpdateSchema } from "./validators.js"

/** Commission open/closed state and copy live on GlobalConfig; these are tiers. */
export const commissionsRouter = createCrudRouter({
  model: CommissionTier,
  resource: "CommissionTier",
  createSchema: tierCreateSchema,
  updateSchema: tierUpdateSchema,
})
