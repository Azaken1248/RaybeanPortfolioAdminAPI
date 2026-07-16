import multer from "multer"
import { ValidationError } from "../utils/errors.js"

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]

const MAX_FILE_SIZE = 25 * 1024 * 1024

/**
 * Memory storage: the buffer goes straight to sharp and then Cloudinary, so
 * nothing untrusted is ever written to the API's disk.
 */
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true)
      return
    }
    cb(
      new ValidationError(
        `Unsupported file type: ${file.mimetype}. Allowed: ${ALLOWED_MIME_TYPES.join(", ")}`,
      ),
    )
  },
})

export { ALLOWED_MIME_TYPES, MAX_FILE_SIZE }
