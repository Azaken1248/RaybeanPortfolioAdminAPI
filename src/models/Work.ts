import { Schema, model, type Document } from "mongoose"
import type { DisciplineId, WorkMedium } from "../types/index.js"

export interface IWorkDocument extends Document {
  id: string
  artist?: string
  title: string
  discipline: DisciplineId
  group: string
  medium: WorkMedium
  description?: string
  imageUrl: string
  width?: number
  height?: number
  altText: string
  href?: string
  embedUrl?: string
  tags: string[]
  year?: string
  featured: boolean
  sortOrder: number
  createdAt: Date
  updatedAt: Date
}

/**
 * One flat collection for every piece of work. `discipline` + `group` place it;
 * `featured` surfaces it on the home page; `sortOrder` is what drag-to-reorder
 * writes. Flat is deliberate — it is why the site's grouping is a query, not a
 * schema migration.
 */
const WorkSchema = new Schema<IWorkDocument>(
  {
    id: {
      type: String,
      required: [true, "Work id (slug) is required"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^[a-z0-9-]+$/, "Work id must be lowercase kebab-case"],
    },
    artist: { type: String, trim: true, maxlength: 200 },
    title: {
      type: String,
      required: [true, "Work title is required"],
      trim: true,
      maxlength: 200,
    },
    discipline: {
      type: String,
      required: true,
      enum: ["graphic-design", "illustration", "video"],
      index: true,
    },
    group: { type: String, required: true, trim: true, index: true },
    medium: {
      type: String,
      required: true,
      enum: ["image", "video", "storyboard"],
      default: "image",
    },
    description: { type: String, trim: true, maxlength: 1000 },
    imageUrl: { type: String, required: [true, "Image URL is required"], trim: true },
    width: { type: Number, min: 1 },
    height: { type: Number, min: 1 },
    altText: {
      type: String,
      required: [true, "Alt text is required for accessibility"],
      trim: true,
      maxlength: 500,
    },
    href: { type: String, trim: true },
    embedUrl: { type: String, trim: true },
    tags: { type: [String], default: [] },
    year: { type: String, trim: true },
    featured: { type: Boolean, default: false, index: true },
    sortOrder: { type: Number, default: 0, index: true },
  },
  { timestamps: true, collection: "works" },
)

// The two reads the site actually performs.
WorkSchema.index({ discipline: 1, group: 1, sortOrder: 1 })
WorkSchema.index({ featured: 1, sortOrder: 1 })

export const Work = model<IWorkDocument>("Work", WorkSchema)
