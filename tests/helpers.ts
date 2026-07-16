import jwt from "jsonwebtoken"
import type { JwtPayload } from "../src/types/auth.js"

/** A cookie for a Discord id that IS on the allowlist. */
export function authCookie(discordId = "123456789"): string {
  const payload: JwtPayload = {
    discordId,
    username: "admin",
    avatar: null,
    role: "admin",
  }
  return `token=${jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: "1h" })}`
}

export const validWork = {
  id: "test-work",
  title: "Test Work",
  discipline: "illustration" as const,
  group: "best-works",
  medium: "image" as const,
  imageUrl: "https://cdn.example.com/a.webp",
  altText: "A test work",
  tags: ["Illustration"],
  featured: false,
  sortOrder: 0,
}

export const validConfig = {
  siteConfig: {
    siteName: "Raybean",
    pageTitle: "Raybean — Portfolio",
    metaDescription: "Portfolio",
    resumeUrl: "/raybean-resume.pdf",
    resumeLabel: "click me for my resume!",
    seo: {
      url: "https://portfolio.raybean.cc",
      ogImage: "/og-image.jpg",
      ogImageAlt: "Raybean",
      themeColor: "#B2ABC0",
    },
  },
  nav: [{ id: "illustration", label: "illustration", to: "/illustration" }],
  socials: [],
  heroContent: {
    greeting: "Hello, I'm Raybean!",
    intro: ["Hi"],
    imageUrl: "/raybean-avatar.webp",
    imageAlt: "Raybean",
    ctaButtons: [],
  },
  featuredSection: { title: "Featured Works" },
  commissions: {
    section: { title: "commissions" },
    isOpen: false,
    heading: "closed!",
    body: ["Not open."],
  },
  contactContent: {
    section: { title: "Contact Me!" },
    buttonLabel: "contact me!",
    methods: [
      {
        id: "discord",
        kind: "discord" as const,
        label: "Discord",
        value: "raybeanosu",
        icon: "discord",
      },
    ],
  },
  footerContent: { copyright: "© {year} Raybean" },
}
