import { Discipline } from "../models/index.js"
import { createCrudRouter } from "./crudRouter.js"
import { disciplineCreateSchema, disciplineUpdateSchema } from "./validators.js"

export const disciplinesRouter = createCrudRouter({
  model: Discipline,
  resource: "Discipline",
  createSchema: disciplineCreateSchema,
  updateSchema: disciplineUpdateSchema,
})
