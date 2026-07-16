import { Schema } from "mongoose"

/** Reusable sub-schemas. `_id: false` keeps embedded objects clean on the wire. */

export const SectionContentSchema = new Schema(
  {
    eyebrow: { type: String, trim: true },
    // Deliberately not `required`: an empty title is meaningful — it tells the
    // website to render the group with no heading (the illustration masonry
    // relies on this). Mongoose treats "" as missing for a required String,
    // which would reject that valid state. Length is still enforced, and the
    // zod layer guarantees the key is present on writes.
    title: { type: String, default: "", trim: true, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 1000 },
  },
  { _id: false },
)

export const CtaButtonSchema = new Schema(
  {
    id: { type: String, required: true, trim: true },
    label: { type: String, required: true, trim: true },
    href: { type: String, required: true, trim: true },
    icon: { type: String, required: true, trim: true },
    external: { type: Boolean, default: false },
  },
  { _id: false },
)

export const NavItemSchema = new Schema(
  {
    id: { type: String, required: true, trim: true },
    label: { type: String, required: true, trim: true },
    to: { type: String, required: true, trim: true },
  },
  { _id: false },
)

export const SocialLinkSchema = new Schema(
  {
    platform: { type: String, required: true, trim: true },
    label: { type: String, required: true, trim: true },
    handle: { type: String, trim: true },
    url: { type: String, trim: true },
    icon: { type: String, required: true, trim: true },
    color: { type: String, trim: true },
    showInHero: { type: Boolean, default: true },
    showInFooter: { type: Boolean, default: true },
    showInContact: { type: Boolean, default: false },
  },
  { _id: false },
)

export const ImageCreditSchema = new Schema(
  {
    text: { type: String, required: true, trim: true },
    note: { type: String, trim: true },
    href: { type: String, trim: true },
  },
  { _id: false },
)

export const WorkGroupSchema = new Schema(
  {
    id: { type: String, required: true, trim: true },
    section: { type: SectionContentSchema, required: true },
    layout: {
      type: String,
      enum: ["grid", "masonry", "video-grid", "carousel"],
      default: "grid",
    },
  },
  { _id: false },
)

export const ContactMethodSchema = new Schema(
  {
    id: { type: String, required: true, trim: true },
    kind: { type: String, enum: ["discord", "email"], required: true },
    label: { type: String, required: true, trim: true },
    note: { type: String, trim: true },
    value: { type: String, required: true, trim: true },
    href: { type: String, trim: true },
    icon: { type: String, required: true, trim: true },
    color: { type: String, trim: true },
  },
  { _id: false },
)

export const ContactFormFieldSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    label: { type: String, required: true, trim: true },
    type: { type: String, enum: ["text", "email", "textarea"], required: true },
    placeholder: { type: String, required: true, trim: true },
    rows: { type: Number, min: 1, max: 20 },
  },
  { _id: false },
)
