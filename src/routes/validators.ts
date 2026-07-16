import { z } from "zod"

/**
 * Request-body schemas. These are strict: unknown keys are rejected rather than
 * ignored, so a typo in the admin UI surfaces as a 400 instead of silently
 * doing nothing.
 */

const slug = z
  .string()
  .trim()
  .min(1)
  .regex(/^[a-z0-9-]+$/, "must be lowercase kebab-case")

const sectionContent = z
  .object({
    eyebrow: z.string().trim().optional(),
    title: z.string().trim().max(200),
    description: z.string().trim().max(1000).optional(),
  })
  .strict()

const disciplineId = z.enum(["graphic-design", "illustration", "video"])
const layout = z.enum(["grid", "masonry", "video-grid", "carousel"])

export const workCreateSchema = z
  .object({
    id: slug,
    artist: z.string().trim().max(200).optional(),
    title: z.string().trim().min(1).max(200),
    discipline: disciplineId,
    group: z.string().trim().min(1),
    medium: z.enum(["image", "video", "storyboard"]).default("image"),
    description: z.string().trim().max(1000).optional(),
    imageUrl: z.string().trim().min(1),
    width: z.number().int().positive().optional(),
    height: z.number().int().positive().optional(),
    altText: z.string().trim().min(1).max(500),
    href: z.string().trim().url().optional(),
    embedUrl: z.string().trim().url().optional(),
    tags: z.array(z.string().trim()).default([]),
    year: z.string().trim().optional(),
    featured: z.boolean().default(false),
    sortOrder: z.number().int().default(0),
  })
  .strict()

export const workUpdateSchema = workCreateSchema.partial().strict()

export const disciplineCreateSchema = z
  .object({
    id: disciplineId,
    route: z.string().trim().min(1),
    navLabel: z.string().trim().min(1),
    icon: z.string().trim().optional(),
    section: sectionContent,
    toolsNote: z.string().trim().max(500).optional(),
    groups: z
      .array(z.object({ id: slug, section: sectionContent, layout }).strict())
      .default([]),
    sortOrder: z.number().int().default(0),
  })
  .strict()

export const disciplineUpdateSchema = disciplineCreateSchema.partial().strict()

export const tierCreateSchema = z
  .object({
    id: slug,
    name: z.string().trim().min(1).max(100),
    priceLabel: z.string().trim().min(1).max(100),
    description: z.string().trim().min(1).max(1000),
    sortOrder: z.number().int().default(0),
  })
  .strict()

export const tierUpdateSchema = tierCreateSchema.partial().strict()

/** Drag-to-reorder payload, shared by every sortable collection. */
export const sortSchema = z
  .object({
    items: z
      .array(z.object({ id: z.string().trim().min(1), sortOrder: z.number().int() }).strict())
      .min(1),
  })
  .strict()

/**
 * The config document is edited a slice at a time, so every top-level key is
 * optional — but each one, if present, is validated in full.
 */
export const configUpdateSchema = z
  .object({
    siteConfig: z
      .object({
        siteName: z.string().trim().min(1),
        pageTitle: z.string().trim().min(1),
        metaDescription: z.string().trim().min(1).max(400),
        resumeUrl: z.string().trim().min(1),
        resumeLabel: z.string().trim().min(1),
        seo: z
          .object({
            url: z.string().trim().url(),
            ogImage: z.string().trim().min(1),
            ogImageAlt: z.string().trim().min(1),
            themeColor: z.string().trim().min(1),
            twitterHandle: z.string().trim().optional(),
          })
          .strict(),
      })
      .strict()
      .optional(),

    nav: z
      .array(
        z
          .object({
            id: slug,
            label: z.string().trim(),
            to: z.string().trim(),
            icon: z.string().trim().optional(),
          })
          .strict(),
      )
      .optional(),

    socials: z
      .array(
        z
          .object({
            platform: z.string().trim().min(1),
            label: z.string().trim().min(1),
            handle: z.string().trim().optional(),
            url: z.string().trim().optional(),
            icon: z.string().trim().min(1),
            color: z.string().trim().optional(),
            showInHero: z.boolean().default(true),
            showInFooter: z.boolean().default(true),
            showInContact: z.boolean().default(false),
          })
          .strict(),
      )
      .optional(),

    heroContent: z
      .object({
        greeting: z.string().trim().min(1),
        intro: z.array(z.string()).default([]),
        imageUrl: z.string().trim().min(1),
        imageAlt: z.string().trim().min(1),
        imageCredit: z
          .object({
            text: z.string().trim().min(1),
            note: z.string().trim().optional(),
            href: z.string().trim().url().optional(),
          })
          .strict()
          .optional(),
        ctaButtons: z
          .array(
            z
              .object({
                id: slug,
                label: z.string().trim().min(1),
                href: z.string().trim().min(1),
                icon: z.string().trim().min(1),
                external: z.boolean().default(false),
              })
              .strict(),
          )
          .default([]),
      })
      .strict()
      .optional(),

    featuredSection: sectionContent.optional(),

    commissions: z
      .object({
        section: sectionContent,
        isOpen: z.boolean(),
        heading: z.string().trim().min(1),
        body: z.array(z.string()).default([]),
        imageUrl: z.string().trim().optional(),
        imageAlt: z.string().trim().optional(),
      })
      .strict()
      .optional(),

    contactContent: z
      .object({
        section: sectionContent,
        buttonLabel: z.string().trim().min(1),
        methods: z
          .array(
            z
              .object({
                id: slug,
                kind: z.enum(["discord", "email"]),
                label: z.string().trim().min(1),
                note: z.string().trim().optional(),
                value: z.string().trim().min(1),
                href: z.string().trim().optional(),
                icon: z.string().trim().min(1),
                color: z.string().trim().optional(),
              })
              .strict(),
          )
          .default([]),
        form: z
          .object({
            fields: z
              .array(
                z
                  .object({
                    name: z.string().trim().min(1),
                    label: z.string().trim().min(1),
                    type: z.enum(["text", "email", "textarea"]),
                    placeholder: z.string().trim(),
                    rows: z.number().int().min(1).max(20).optional(),
                  })
                  .strict(),
              )
              .default([]),
            submitLabel: z.string().trim().min(1),
            endpoint: z.string().trim().min(1),
            disclaimer: z.string().trim().optional(),
          })
          .strict()
          .optional(),
      })
      .strict()
      .optional(),

    footerContent: z
      .object({
        copyright: z.string().trim().min(1),
        tagline: z.string().trim().optional(),
        credit: z
          .object({
            prefix: z.string().trim().min(1),
            name: z.string().trim().min(1),
            href: z.string().trim().url().optional(),
          })
          .strict()
          .optional(),
      })
      .strict()
      .optional(),
  })
  .strict()
