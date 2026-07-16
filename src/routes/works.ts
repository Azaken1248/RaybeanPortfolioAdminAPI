import { Work } from "../models/index.js"
import { createCrudRouter } from "./crudRouter.js"
import { workCreateSchema, workUpdateSchema } from "./validators.js"

export const worksRouter = createCrudRouter({
  model: Work,
  resource: "Work",
  createSchema: workCreateSchema,
  updateSchema: workUpdateSchema,
})
