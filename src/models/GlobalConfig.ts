import { Schema, model, type Document } from "mongoose"
import {
  CtaButtonSchema,
  ContactFormFieldSchema,
  ContactMethodSchema,
  ImageCreditSchema,
  NavItemSchema,
  SectionContentSchema,
  SocialLinkSchema,
} from "./schemas.js"
import type {
  ICommissionsConfig,
  IContactContent,
  IFooterContent,
  IHeroContent,
  INavItem,
  ISectionContent,
  ISiteConfig,
  ISocialLink,
} from "../types/index.js"

export interface IGlobalConfigDocument extends Document {
  siteConfig: ISiteConfig
  nav: INavItem[]
  socials: ISocialLink[]
  heroContent: IHeroContent
  featuredSection: ISectionContent
  commissions: ICommissionsConfig
  contactContent: IContactContent
  footerContent: IFooterContent
  createdAt: Date
  updatedAt: Date
}

/**
 * A singleton document: everything on the site that is not a list of works.
 * One row, edited in place — see `getOrCreateConfig` in routes/config.ts.
 */
const GlobalConfigSchema = new Schema<IGlobalConfigDocument>(
  {
    siteConfig: {
      siteName: { type: String, required: true, trim: true },
      pageTitle: { type: String, required: true, trim: true },
      metaDescription: { type: String, required: true, trim: true, maxlength: 400 },
      resumeUrl: { type: String, required: true, trim: true },
      resumeLabel: { type: String, required: true, trim: true },
      seo: {
        url: { type: String, required: true, trim: true },
        ogImage: { type: String, required: true, trim: true },
        ogImageAlt: { type: String, required: true, trim: true },
        themeColor: { type: String, required: true, trim: true },
        twitterHandle: { type: String, trim: true },
      },
    },

    nav: { type: [NavItemSchema], default: [] },
    socials: { type: [SocialLinkSchema], default: [] },

    heroContent: {
      greeting: { type: String, required: true, trim: true },
      intro: { type: [String], default: [] },
      imageUrl: { type: String, required: true, trim: true },
      imageAlt: { type: String, required: true, trim: true },
      imageCredit: { type: ImageCreditSchema, required: false },
      ctaButtons: { type: [CtaButtonSchema], default: [] },
    },

    featuredSection: { type: SectionContentSchema, required: true },

    commissions: {
      section: { type: SectionContentSchema, required: true },
      isOpen: { type: Boolean, default: false },
      heading: { type: String, required: true, trim: true },
      body: { type: [String], default: [] },
      imageUrl: { type: String, trim: true },
      imageAlt: { type: String, trim: true },
    },

    contactContent: {
      section: { type: SectionContentSchema, required: true },
      buttonLabel: { type: String, required: true, trim: true },
      methods: { type: [ContactMethodSchema], default: [] },
      // Absent until the message bot exists. Its presence is what makes the
      // website render a contact form.
      form: {
        type: new Schema(
          {
            fields: { type: [ContactFormFieldSchema], default: [] },
            submitLabel: { type: String, required: true, trim: true },
            endpoint: { type: String, required: true, trim: true },
            disclaimer: { type: String, trim: true },
          },
          { _id: false },
        ),
        required: false,
      },
    },

    footerContent: {
      copyright: { type: String, required: true, trim: true },
      tagline: { type: String, trim: true },
      credit: {
        type: new Schema(
          {
            prefix: { type: String, required: true, trim: true },
            name: { type: String, required: true, trim: true },
            href: { type: String, trim: true },
          },
          { _id: false },
        ),
        required: false,
      },
    },
  },
  { timestamps: true, collection: "globalconfig" },
)

export const GlobalConfig = model<IGlobalConfigDocument>(
  "GlobalConfig",
  GlobalConfigSchema,
)
