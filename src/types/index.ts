export type {
  JwtPayload,
  AuthenticatedRequest,
  DiscordTokenResponse,
  DiscordUser,
} from "./auth.js"

/**
 * These mirror `apiTypes.ts` in BeanPortfolioWebsite. That file is the contract:
 * the website's adapter reads exactly this shape. Change one, change both.
 */

export type DisciplineId = "graphic-design" | "illustration" | "video"
export type WorkMedium = "image" | "video" | "storyboard"
export type GroupLayout = "grid" | "masonry" | "video-grid" | "carousel"

export interface ISectionContent {
  eyebrow?: string
  title: string
  description?: string
}

export interface ISeoConfig {
  url: string
  ogImage: string
  ogImageAlt: string
  themeColor: string
  twitterHandle?: string
}

export interface ISiteConfig {
  siteName: string
  pageTitle: string
  metaDescription: string
  resumeUrl: string
  resumeLabel: string
  seo: ISeoConfig
}

export interface INavItem {
  id: string
  label: string
  to: string
}

export interface ISocialLink {
  platform: string
  label: string
  handle?: string
  url?: string
  icon: string
  color?: string
  showInHero: boolean
  showInFooter: boolean
  showInContact: boolean
}

export interface ICtaButton {
  id: string
  label: string
  href: string
  icon: string
  external?: boolean
}

export interface IImageCredit {
  text: string
  note?: string
  href?: string
}

export interface IHeroContent {
  greeting: string
  intro: string[]
  imageUrl: string
  imageAlt: string
  imageCredit?: IImageCredit
  ctaButtons: ICtaButton[]
}

export interface IWorkGroup {
  id: string
  section: ISectionContent
  layout: GroupLayout
}

export interface ICommissionsConfig {
  section: ISectionContent
  isOpen: boolean
  heading: string
  body: string[]
  imageUrl?: string
  imageAlt?: string
}

export interface IContactMethod {
  id: string
  kind: "discord" | "email"
  label: string
  note?: string
  value: string
  href?: string
  icon: string
  color?: string
}

export interface IContactFormField {
  name: string
  label: string
  type: "text" | "email" | "textarea"
  placeholder: string
  rows?: number
}

export interface IContactForm {
  fields: IContactFormField[]
  submitLabel: string
  endpoint: string
  disclaimer?: string
}

export interface IContactContent {
  section: ISectionContent
  buttonLabel: string
  methods: IContactMethod[]
  form?: IContactForm
}

export interface IFooterCredit {
  prefix: string
  name: string
  href?: string
}

export interface IFooterContent {
  copyright: string
  tagline?: string
  credit?: IFooterCredit
}

export interface ApiResponse<T = unknown> {
  success: true
  data: T
}

export interface ApiErrorResponse {
  success: false
  error: { code: string; message: string; details?: unknown; stack?: string }
}
