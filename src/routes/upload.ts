import { Router, type Request, type Response } from "express"
import sharp from "sharp"
import { getCloudinary } from "../config/cloudinary.js"
import { env } from "../config/env.js"
import { requireAuth } from "../middleware/auth.js"
import { uploadLimiter } from "../middleware/rateLimit.js"
import { upload } from "../middleware/upload.js"
import { ValidationError } from "../utils/errors.js"

const router = Router()

const MAX_EDGE = 1600
const WEBP_QUALITY = 82

interface CloudinaryResult {
  secure_url: string
  public_id: string
  width: number
  height: number
  bytes: number
}

/**
 * POST /api/upload — the admin's image pipeline.
 *
 * Optimises before storing rather than after: a 6MB PNG becomes a ~150KB WebP
 * capped at 1600px, which is the size the site actually renders. Returns the
 * dimensions too, because `Work.width/height` is what stops the masonry
 * squashing portraits into 16:9.
 */
router.post(
  "/",
  uploadLimiter,
  requireAuth,
  upload.single("image"),
  async (req: Request, res: Response) => {
    if (!req.file) throw new ValidationError("An image file is required")

    let optimised: Buffer
    let width: number | undefined
    let height: number | undefined

    try {
      const pipeline = sharp(req.file.buffer, { failOn: "error" })
        .rotate() // honour EXIF orientation before we discard the metadata
        .resize({
          width: MAX_EDGE,
          height: MAX_EDGE,
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({ quality: WEBP_QUALITY })

      const output = await pipeline.toBuffer({ resolveWithObject: true })
      optimised = output.data
      width = output.info.width
      height = output.info.height
    } catch {
      // sharp throws on anything that is not really an image, whatever the
      // client claimed its mime type was.
      throw new ValidationError("File is not a readable image")
    }

    const result = await new Promise<CloudinaryResult>((resolve, reject) => {
      const stream = getCloudinary().uploader.upload_stream(
        {
          folder: env.CLOUDINARY_FOLDER,
          resource_type: "image",
          format: "webp",
        },
        (error, uploaded) => {
          if (error || !uploaded) {
            reject(error ?? new Error("Cloudinary upload failed"))
            return
          }
          resolve(uploaded as unknown as CloudinaryResult)
        },
      )
      stream.end(optimised)
    })

    res.status(201).json({
      success: true,
      data: {
        url: result.secure_url,
        publicId: result.public_id,
        width: width ?? result.width,
        height: height ?? result.height,
        bytes: result.bytes,
      },
    })
  },
)

export { router as uploadRouter }
