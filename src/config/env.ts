import "dotenv/config"

function requireEnv(key: string): string {
  const value = process.env[key]
  if (!value) {
    throw new Error(`[ENV] Missing required environment variable: ${key}`)
  }
  return value
}

function optionalEnv(key: string, fallback: string): string {
  return process.env[key] ?? fallback
}

function splitList(value: string): string[] {
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
}

/**
 * Lazily read so tests can set variables before first access, and so a missing
 * value fails loudly at the point of use rather than silently defaulting.
 */
export const env = {
  get PORT(): number {
    return Number.parseInt(optionalEnv("PORT", "5000"), 10)
  },
  get NODE_ENV(): "development" | "production" | "test" {
    return optionalEnv("NODE_ENV", "development") as
      | "development"
      | "production"
      | "test"
  },
  get IS_PRODUCTION(): boolean {
    return this.NODE_ENV === "production"
  },
  get IS_TEST(): boolean {
    return this.NODE_ENV === "test"
  },

  get MONGO_URI(): string {
    return requireEnv("MONGO_URI")
  },

  get JWT_SECRET(): string {
    const secret = requireEnv("JWT_SECRET")
    // A short secret is the difference between "signed" and "forgeable".
    if (secret.length < 32 && this.IS_PRODUCTION) {
      throw new Error("[ENV] JWT_SECRET must be at least 32 characters")
    }
    return secret
  },

  get DISCORD_CLIENT_ID(): string {
    return requireEnv("DISCORD_CLIENT_ID")
  },
  get DISCORD_CLIENT_SECRET(): string {
    return requireEnv("DISCORD_CLIENT_SECRET")
  },
  get DISCORD_REDIRECT_URI(): string {
    return requireEnv("DISCORD_REDIRECT_URI")
  },
  get ALLOWED_DISCORD_IDS(): string[] {
    const ids = splitList(requireEnv("ALLOWED_DISCORD_IDS"))
    if (ids.length === 0) {
      throw new Error("[ENV] ALLOWED_DISCORD_IDS must list at least one id")
    }
    return ids
  },

  get CLOUDINARY_CLOUD_NAME(): string {
    return requireEnv("CLOUDINARY_CLOUD_NAME")
  },
  get CLOUDINARY_API_KEY(): string {
    return requireEnv("CLOUDINARY_API_KEY")
  },
  get CLOUDINARY_API_SECRET(): string {
    return requireEnv("CLOUDINARY_API_SECRET")
  },
  get CLOUDINARY_FOLDER(): string {
    return optionalEnv("CLOUDINARY_FOLDER", "bean-portfolio")
  },

  get CLIENT_URL(): string {
    return optionalEnv("CLIENT_URL", "http://localhost:5174")
  },
  get ALLOWED_ORIGINS(): string[] {
    const origins = process.env.ALLOWED_ORIGINS
    return origins ? splitList(origins) : [this.CLIENT_URL]
  },
}

export type Env = typeof env
