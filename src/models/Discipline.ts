import { Schema, model, type Document } from "mongoose"
import { SectionContentSchema, WorkGroupSchema } from "./schemas.js"
import type { DisciplineId, ISectionContent, IWorkGroup } from "../types/index.js"

export interface IDisciplineDocument extends Document {
  id: DisciplineId
  route: string
  navLabel: string
  section: ISectionContent
  toolsNote?: string
  groups: IWorkGroup[]
  sortOrder: number
  createdAt: Date
  updatedAt: Date
}

const DisciplineSchema = new Schema<IDisciplineDocument>(
  {
    // `id` is the stable slug the website routes and works reference. It is not
    // the Mongo _id, and it must be unique.
    id: {
      type: String,
      required: [true, "Discipline id is required"],
      enum: ["graphic-design", "illustration", "video"],
      unique: true,
      trim: true,
    },
    route: { type: String, required: true, trim: true },
    navLabel: { type: String, required: true, trim: true },
    section: { type: SectionContentSchema, required: true },
    toolsNote: { type: String, trim: true, maxlength: 500 },
    groups: { type: [WorkGroupSchema], default: [] },
    sortOrder: { type: Number, default: 0, index: true },
  },
  { timestamps: true, collection: "disciplines" },
)

export const Discipline = model<IDisciplineDocument>(
  "Discipline",
  DisciplineSchema,
)
