import { Schema, model, type Document } from "mongoose"

export interface ICommissionTierDocument extends Document {
  id: string
  name: string
  priceLabel: string
  description: string
  sortOrder: number
  createdAt: Date
  updatedAt: Date
}

const CommissionTierSchema = new Schema<ICommissionTierDocument>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^[a-z0-9-]+$/, "Tier id must be lowercase kebab-case"],
    },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    priceLabel: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, required: true, trim: true, maxlength: 1000 },
    sortOrder: { type: Number, default: 0, index: true },
  },
  { timestamps: true, collection: "commissiontiers" },
)

export const CommissionTier = model<ICommissionTierDocument>(
  "CommissionTier",
  CommissionTierSchema,
)
