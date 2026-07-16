import { v2 as cloudinary } from "cloudinary"
import { env } from "./env.js"

let configured = false

/**
 * Configured on first use rather than at import, so importing a route in a test
 * does not require real Cloudinary credentials.
 */
export function getCloudinary(): typeof cloudinary {
  if (!configured) {
    cloudinary.config({
      cloud_name: env.CLOUDINARY_CLOUD_NAME,
      api_key: env.CLOUDINARY_API_KEY,
      api_secret: env.CLOUDINARY_API_SECRET,
      secure: true,
    })
    configured = true
  }
  return cloudinary
}
